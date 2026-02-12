import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as Record<string, unknown>).username as string;
        token.firstName = (user as Record<string, unknown>).firstName as string;
        token.profilePicture = (user as Record<string, unknown>).profilePicture as string | null;
      } else if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: Number(token.id) },
          select: { profilePicture: true },
        });
        if (dbUser) token.profilePicture = dbUser.profilePicture;
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
