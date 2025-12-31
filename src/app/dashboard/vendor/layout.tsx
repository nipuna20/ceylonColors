import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export default async function VendorLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });

  // If not created or not approved, keep vendor out of dashboard content:
  if (!vendor) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-xl font-semibold mb-2">Create your vendor profile</h1>
        <p className="text-gray-700">Start by submitting your vendor application.</p>
        <a href="/auth/vendor-signup" className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-white">
          Become a vendor
        </a>
      </div>
    );
  }

  if (vendor.status !== "APPROVED") {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-xl font-semibold mb-2">Your application is under review</h1>
        <p className="text-gray-700">
          Status: <b>{vendor.status}</b>
          {vendor.rejectionReason ? <> — Reason: {vendor.rejectionReason}</> : null}
        </p>
        <a href="/dashboard/vendor/onboarding/status" className="mt-3 inline-block rounded-xl border px-4 py-2">
          View application status
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
