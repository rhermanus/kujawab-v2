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

      // Google sign-in: look up or create user in DB
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
        } else {
          // Create new user from Google profile
          const baseName = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 16);
          let username = baseName;
          let suffix = 1;
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${baseName}${suffix}`;
            suffix++;
          }

          dbUser = await prisma.user.create({
            data: {
              firstName: profile.given_name ?? profile.name?.split(" ")[0] ?? "User",
              lastName: profile.family_name ?? "",
              username,
              email,
              confirmed: true,
              oauth2Id: profile.sub,
              oauth2Provider: "google",
              profilePicture: profile.picture ?? "/profpic_placeholder.jpg",
            },
          });
        }

        token.id = String(dbUser.id);
        token.username = dbUser.username;
        token.firstName = dbUser.firstName;
        token.name = `${dbUser.firstName} ${dbUser.lastName ?? ""}`.trim();
        token.email = dbUser.email;
        token.profilePicture = dbUser.profilePicture;
      }

      // Subsequent requests: refresh from DB
      if (!user && !account && token.id) {
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
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.firstName = token.firstName as string;
      session.user.profilePicture = token.profilePicture as string | null;
      return session;
    },
  },
});
