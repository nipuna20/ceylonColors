"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function approveVendor(formData: FormData) {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  await db.vendor.update({
    where: { id },
    data: { status: "APPROVED", isApproved: true, approvedAt: new Date() },
  });
  revalidatePath("/dashboard/admin/vendors/applications");
  revalidatePath("/dashboard/vendor"); // so gated layout unlocks
}

export async function rejectVendor(formData: FormData) {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "");
  await db.vendor.update({
    where: { id },
    data: { status: "REJECTED", isApproved: false, rejectionReason: reason, rejectedAt: new Date() },
  });
  revalidatePath("/dashboard/admin/vendors/applications");
}
