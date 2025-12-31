"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Prisma, PaymentStatus } from "@prisma/client";

// If your PaymentStatus enum has different values, update them here:
const CARD_OK_STATUSES: PaymentStatus[] = [
    PaymentStatus.CAPTURED,
    PaymentStatus.PAID,
  ];

export async function markCodCommissionsReceived(formData: FormData) {
  await requireRole(["ADMIN"]);
  const vendorId = String(formData.get("vendorId") ?? "");

  // ✅ Tell TS exactly what this is
  const commonWhere: Prisma.VendorOrderWhereInput = {
    status: { not: "CANCELLED" as any },               // or import Prisma.OrderStatus and use as that
    codCommissionSettledAt: null,
    // COD = no successful card capture:
    OR: [
      // A) explicitly no payment row
      { order: { is: { payment: { is: null } } } },
      // B) has a payment row, but it's NOT a captured/paid/completed CARD
      {
        order: {
          is: {
            payment: {
              is: {
                NOT: {
                  method: "CARD" as any,                // or Prisma.PaymentMethod.CARD
                  status: { in: CARD_OK_STATUSES },
                },
              },
            },
          },
        },
      },
    ],
  };

  if (vendorId === "*ALL*") {
    await db.vendorOrder.updateMany({
      where: commonWhere,
      data: { codCommissionSettledAt: new Date() },
    });
  } else {
    await db.vendorOrder.updateMany({
      where: { AND: [{ vendorId }, commonWhere] },      // ✅ vendor filter + the common filter
      data: { codCommissionSettledAt: new Date() },
    });
  }

  revalidatePath("/dashboard/admin/payouts/cod");
  revalidatePath("/dashboard/vendor/finances");
  revalidatePath("/dashboard/vendor/finances/receivables");
}
