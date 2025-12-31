// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { compare } from "bcrypt";
import { db } from "@/lib/db";

// v4-style options (no trustHost)
export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = (credentials ?? {}) as Record<
          string,
          string
        >;
        if (!email || !password) return null;

        const user = await db.user.findUnique({
          where: { email },
        });
        if (!user) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        // include avatarUrl so we can put it into the token
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
          avatarUrl: (user as any).avatarUrl ?? null,
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: JWT & { role?: string; avatarUrl?: string | null }; user?: any }) {
      // when the user signs in, copy extra fields into the token
      if (user) {
        token.role = (user as any).role;
        token.avatarUrl = (user as any).avatarUrl ?? null;
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & { role?: string; avatarUrl?: string | null };
    }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.sub;
        (session.user as any).avatarUrl = token.avatarUrl ?? null;
      }
      return session;
    },
  },
};
