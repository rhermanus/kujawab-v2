import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials.email as string;
        const password = credentials.password as string;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        // User signed up with Google only — no password set
        if (!user.password) return null;

        // Laravel uses $2y$ prefix, bcryptjs needs $2b$
        const hash = user.password.replace(/^\$2y\$/, "$2b$");
        const valid = await bcrypt.compare(password, hash);

        if (!valid) return null;

        return {
          id: String(user.id),
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          profilePicture: user.profilePicture,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Credentials sign-in: user object is set by authorize()
      if (user && account?.provider === "credentials") {
        token.id = user.id;
        token.username = (user as Record<string, unknown>).username as string;
        token.firstName = (user as Record<string, unknown>).firstName as string;
        token.profilePicture = (user as Record<string, unknown>).profilePicture as string | null;
      }

      // Google sign-in: look up user in DB
      if (account?.provider === "google" && profile?.email) {
        const email = profile.email;
        let dbUser = await prisma.user.findUnique({ where: { email } });

        if (dbUser) {
          // Link existing account if not already linked
          if (!dbUser.oauth2Id) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                oauth2Id: profile.sub,
                oauth2Provider: "google",
              },
            });
          }

          token.id = String(dbUser.id);
          token.username = dbUser.username;
          token.firstName = dbUser.firstName;
          token.name = `${dbUser.firstName} ${dbUser.lastName ?? ""}`.trim();
          token.email = dbUser.email;
          token.profilePicture = dbUser.profilePicture;
          token.pendingRegistration = undefined;
        } else {
          // New Google user — mark as pending registration
          token.pendingRegistration = {
            email: profile.email,
            firstName: profile.given_name ?? profile.name?.split(" ")[0] ?? "",
            lastName: profile.family_name ?? "",
            oauth2Id: profile.sub!,
            oauth2Provider: "google",
            profilePicture: profile.picture ?? "/profpic_placeholder.jpg",
          };
        }
      }

      // Subsequent requests: refresh from DB
      if (!user && !account) {
        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(token.id) },
            select: { username: true, firstName: true, lastName: true, profilePicture: true },
          });
          if (dbUser) {
            token.username = dbUser.username;
            token.firstName = dbUser.firstName;
            token.name = `${dbUser.firstName} ${dbUser.lastName ?? ""}`.trim();
            token.profilePicture = dbUser.profilePicture;
          }
        } else if (token.pendingRegistration) {
          // Check if user completed registration since last token refresh
          const pending = token.pendingRegistration as { email: string };
          const dbUser = await prisma.user.findUnique({ where: { email: pending.email } });
          if (dbUser) {
            token.id = String(dbUser.id);
            token.username = dbUser.username;
            token.firstName = dbUser.firstName;
            token.name = `${dbUser.firstName} ${dbUser.lastName ?? ""}`.trim();
            token.email = dbUser.email;
            token.profilePicture = dbUser.profilePicture;
            token.pendingRegistration = undefined;
          }
        }
      }

      return token;
    },
    session({ session, token }) {
      if (token.pendingRegistration) {
        session.pendingRegistration = token.pendingRegistration as {
          email: string;
          firstName: string;
          lastName: string;
          oauth2Id: string;
          oauth2Provider: string;
          profilePicture: string;
        };
      }
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.firstName = token.firstName as string;
      session.user.profilePicture = token.profilePicture as string | null;
      return session;
    },
  },
});
