"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

const CARD_OK_STATUS = PaymentStatus.PAID;

export async function createOnlinePayouts() {
  await requireRole(["ADMIN"]);

  const vendors = await db.vendor.findMany({
    select: { id: true, commissionPct: true },
  });

  await db.$transaction(async (tx) => {
    for (const v of vendors) {
      const vos = await tx.vendorOrder.findMany({
        where: {
          vendorId: v.id,
          status: { not: "CANCELLED" },
          payoutItems: { none: {} },
          order: {
            is: {
              payment: {
                is: { method: "CARD", status: CARD_OK_STATUS }, // ✅
              },
            },
          },
        },
        select: { id: true, subtotalCents: true, order: { select: { createdAt: true } } },
      });
      type VoRow = typeof vos[number];

      if (!vos.length) continue;

      const gross = vos.reduce((acc: number, it: VoRow) => acc + it.subtotalCents, 0);
      const commission = Math.round((gross * v.commissionPct) / 100);
      const net = gross - commission;

      const times = vos.map((x: VoRow) => x.order.createdAt.getTime());
      const periodStart = new Date(Math.min(...times));
      const periodEnd = new Date(Math.max(...times));

      const payout = await tx.payout.create({
        data: {
          vendorId: v.id,
          amountCents: net,
          status: "DUE",
          periodStart,
          periodEnd,
        },
      });

      await tx.payoutItem.createMany({
        data: vos.map((it: VoRow) => ({
          payoutId: payout.id,
          vendorOrderId: it.id,
          amountCents: it.subtotalCents,
        })),
      });
    }
  });

  revalidatePath("/dashboard/admin/payouts");
  revalidatePath("/dashboard/vendor/finances/receivables");
}
