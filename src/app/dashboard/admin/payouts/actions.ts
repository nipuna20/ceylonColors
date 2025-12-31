"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

const periodSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function toDates(startStr: string, endStr: string) {
  const start = new Date(`${startStr}T00:00:00.000Z`);
  const end = new Date(`${endStr}T00:00:00.000Z`);
  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, end, endExclusive };
}

async function computeVendorPayables(startStr: string, endStr: string) {
  const { start, endExclusive } = toDates(startStr, endStr);
  const vos = await db.vendorOrder.findMany({
    where: {
      status: "COMPLETED",
      order: { is: { createdAt: { gte: start, lt: endExclusive } } },
    },
    include: { vendor: { select: { id: true, commissionPct: true, shopName: true } } },
  });

  const byVendor = new Map<
    string,
    { shopName: string; commissionPct: number; subtotalCents: number; dueCents: number }
  >();

  for (const vo of vos) {
    const commissionPct = vo.vendor.commissionPct ?? 10;
    const prev = byVendor.get(vo.vendorId) ?? {
      shopName: vo.vendor.shopName,
      commissionPct,
      subtotalCents: 0,
      dueCents: 0,
    };
    prev.subtotalCents += vo.subtotalCents;
    prev.dueCents = Math.round(prev.subtotalCents * (100 - commissionPct) / 100);
    byVendor.set(vo.vendorId, prev);
  }

  return byVendor;
}

export async function createPayouts(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const parsed = periodSchema.parse({
    start: String(formData.get("start") ?? ""),
    end: String(formData.get("end") ?? ""),
  });
  const { start, end } = toDates(parsed.start, parsed.end);

  const payables = await computeVendorPayables(parsed.start, parsed.end);

  for (const [vendorId, v] of payables) {
    if (v.dueCents <= 0) continue;

    const exists = await db.payout.findFirst({
      where: { vendorId, periodStart: start, periodEnd: end },
      select: { id: true },
    });
    if (exists) continue;

    await db.payout.create({
      data: {
        vendorId,
        amountCents: v.dueCents,
        status: "DUE",
        periodStart: start,
        periodEnd: end,
      },
    });
  }

  revalidatePath("/dashboard/admin/payouts");
  // ✅ no return value
}

export async function setPayoutStatus(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "DUE") as "DUE" | "PAID" | "HOLD";
  if (!id) return;
  await db.payout.update({ where: { id }, data: { status } });
  revalidatePath("/dashboard/admin/payouts");
}

export async function deletePayout(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.payout.delete({ where: { id } });
  revalidatePath("/dashboard/admin/payouts");
}
