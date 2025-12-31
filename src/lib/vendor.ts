import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

/** Ensure the user is a vendor AND approved; otherwise send to gating page. */
export async function requireApprovedVendor() {
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });
  if (!vendor) redirect("/auth/vendor-signup");
  if (vendor.status !== "APPROVED") redirect("/dashboard/vendor/onboarding/status");
  return { session, vendor };
}
