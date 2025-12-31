"use server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function markVendorCodSettled(formData: FormData) {
  await requireRole(["ADMIN"]);
  const vendorId = String(formData.get("vendorId"));

await db.vendorOrder.updateMany({
  where: {
    vendorId,
    status: { not: "CANCELLED" },
    codCommissionSettledAt: null,
    OR: [
      { order: { payment: { is: null } } },
      { order: { payment: { is: { NOT: { method: "CARD", status: "CAPTURED" } } } } },
    ],
  },
  data: { codCommissionSettledAt: new Date() },
});


  revalidatePath("/dashboard/admin/settlements/cod");
  revalidatePath("/dashboard/vendor/finances/cod");
}
