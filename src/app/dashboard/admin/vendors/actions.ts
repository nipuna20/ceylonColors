"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function approveVendor(formData: FormData): Promise<void> {
  const session = await requireRole(["ADMIN"]);
  const adminId = (session.user as any).id;
  const id = String(formData.get("id"));

  await db.vendor.update({
    where: { id },
    data: {
      status: "APPROVED",
      isApproved: true,
      approvedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
      approvedById: adminId,
    },
  });

  revalidatePath("/dashboard/admin/vendors");
  revalidatePath(`/dashboard/admin/vendors/${id}`);
}

export async function rejectVendor(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "Not specified");

  await db.vendor.update({
    where: { id },
    data: {
      status: "REJECTED",
      isApproved: false,
      rejectedAt: new Date(),
      rejectionReason: reason,
    },
  });

  revalidatePath("/dashboard/admin/vendors");
  revalidatePath(`/dashboard/admin/vendors/${id}`);
}

export async function setCommission(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  const pct = Math.max(0, Math.min(50, Number(formData.get("pct") ?? 0)));

  await db.vendor.update({
    where: { id },
    data: { commissionPct: Math.round(pct) },
  });

  revalidatePath("/dashboard/admin/vendors");
  revalidatePath(`/dashboard/admin/vendors/${id}`);
}

export async function suspendVendor(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  await db.vendor.update({ where: { id }, data: { status: "SUSPENDED" } });
  revalidatePath("/dashboard/admin/vendors");
  revalidatePath(`/dashboard/admin/vendors/${id}`);
}

export async function reactivateVendor(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  await db.vendor.update({ where: { id }, data: { status: "APPROVED" } });
  revalidatePath("/dashboard/admin/vendors");
  revalidatePath(`/dashboard/admin/vendors/${id}`);
}

export async function verifyVendorDoc(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const docId = String(formData.get("docId"));
  const to = String(formData.get("to")) === "true";
  await db.vendorDocument.update({ where: { id: docId }, data: { verified: to } });
  // Revalidate both possible views
  revalidatePath("/dashboard/admin/vendors");
  // Find vendor id for detail page revalidation
  const doc = await db.vendorDocument.findUnique({ where: { id: docId } });
  if (doc) revalidatePath(`/dashboard/admin/vendors/${doc.vendorId}`);
}
