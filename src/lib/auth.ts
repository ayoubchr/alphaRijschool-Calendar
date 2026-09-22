import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function authorizeStaffUser(email: string, password: string) {
  const user = await prisma.staffUser.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await compare(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email, role: user.role, instructorId: user.instructorId ?? undefined };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        return authorizeStaffUser(email, password);
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = (user as any).role;
        token.instructorId = (user as any).instructorId;
      }
      return token;
    },
    session: ({ session, token }) => {
      (session.user as any).role = token.role;
      (session.user as any).instructorId = token.instructorId;
      return session;
    },
  },
});
