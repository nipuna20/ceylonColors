import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function VendorOnboardingStatus() {
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });
  if (!vendor) redirect("/auth/vendor-signup");
  if (vendor.status === "APPROVED") redirect("/dashboard/vendor");

  return (
    <div className="rounded-xl border bg-white p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Vendor application</h1>
      <div>Status: <b>{vendor.status}</b></div>
      {vendor.rejectionReason && (
        <div className="text-red-600">Reason: {vendor.rejectionReason}</div>
      )}
      <p className="text-gray-600">
        We’ll notify you by email once your application is reviewed.
      </p>
      <Link href="/products" className="inline-block rounded-xl border px-4 py-2">Back to shopping</Link>
    </div>
  );
}
