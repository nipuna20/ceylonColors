"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function setVendorApproval(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  const approved = String(formData.get("approved")) === "true";
  await db.vendor.update({ where: { id }, data: { isApproved: approved } });
  revalidatePath("/dashboard/admin/vendors");
}

export async function setProductActive(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  await db.product.update({ where: { id }, data: { active } });
  revalidatePath("/dashboard/admin/products");
  revalidatePath("/products");
}
