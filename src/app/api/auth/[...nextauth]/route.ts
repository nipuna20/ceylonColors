// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// v4 App Router pattern
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
