import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Use a single handler function for both methods (most reliable)
const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
