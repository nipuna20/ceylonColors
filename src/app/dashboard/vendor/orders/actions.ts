"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function updateVendorOrderStatus(formData: FormData) {
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as
    | "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";

  const vo = await db.vendorOrder.findUnique({ where: { id }, include: { order: true, vendor: true } });
  if (!vo) throw new Error("Not found");

  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });
  if (!vendor || vo.vendorId !== vendor.id) throw new Error("Not your order");

  await db.vendorOrder.update({ where: { id }, data: { status } });

  // If all vendor orders completed -> complete the main order
  const siblings = await db.vendorOrder.findMany({ where: { orderId: vo.orderId } });
  const allDone = siblings.every(s => s.status === "COMPLETED");
  if (allDone) {
    await db.order.update({ where: { id: vo.orderId }, data: { status: "COMPLETED" } });
  }

  revalidatePath("/dashboard/vendor/orders");
}
