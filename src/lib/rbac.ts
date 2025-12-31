import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export async function requireRole(roles: Array<"BUYER" | "VENDOR" | "ADMIN">) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !roles.includes((session.user as any).role)) {
    redirect("/auth/signin");
  }
  return session;
}
