import { db } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

// Consider a card payment “cleared” once it is PAID (matches your notify logic)
const CARD_OK_STATUS = PaymentStatus.PAID;

/** ---------- Types ---------- */
export type CardReceivablesItem = {
  id: string;
  orderId: string;
  createdAt: Date;
  subtotalCents: number;
};

export type CardReceivables = {
  vendorId: string;
  commissionPct: number;
  gross: number;
  commission: number;
  net: number;
  items: CardReceivablesItem[];
};

export type CardPayableRow = {
  vendorId: string;
  shopName: string;
  commissionPct: number;
  gross: number;
  commission: number;
  net: number;
  count: number;
};

export type CodCommissionVendorRow = {
  vendorId: string;
  shopName: string;
  commissionPct: number;
  commissionCents: number;
  count: number;
};

/** ---------- Card receivables for a single vendor ---------- */
export async function cardReceivablesForVendor(vendorId: string): Promise<CardReceivables> {
  const vos = await db.vendorOrder.findMany({
    where: {
      vendorId,
      status: { not: "CANCELLED" },
      payoutItems: { none: {} },
      order: {
        is: {
          payment: {
            is: { method: "CARD", status: CARD_OK_STATUS },
          },
        },
      },
    },
    select: {
      id: true,
      orderId: true,
      subtotalCents: true,
      vendor: { select: { commissionPct: true, shopName: true } },
      order: { select: { createdAt: true } },
    },
  });
  type VoRow = (typeof vos)[number];

  const commissionPct = vos[0]?.vendor.commissionPct ?? 0;
  const gross = vos.reduce((acc: number, vo: VoRow) => acc + vo.subtotalCents, 0);
  const commission = Math.round((gross * commissionPct) / 100);
  const net = gross - commission;

  const items: CardReceivablesItem[] = vos.map((vo: VoRow) => ({
    id: vo.id,
    orderId: vo.orderId,
    createdAt: vo.order.createdAt,
    subtotalCents: vo.subtotalCents,
  }));

  return { vendorId, commissionPct, gross, commission, net, items };
}

/** ---------- Card payables grouped by vendor (admin) ---------- */
export async function cardPayablesByVendor(): Promise<CardPayableRow[]> {
  const vendors = await db.vendor.findMany({ select: { id: true, shopName: true, commissionPct: true } });
  const results: CardPayableRow[] = [];

  for (const v of vendors) {
    const due = await db.vendorOrder.findMany({
      where: {
        vendorId: v.id,
        status: { not: "CANCELLED" },
        payoutItems: { none: {} },
        order: {
          is: {
            payment: {
              is: { method: "CARD", status: CARD_OK_STATUS },
            },
          },
        },
      },
      select: { subtotalCents: true },
    });

    if (!due.length) continue;

    const gross = due.reduce((acc, row) => acc + row.subtotalCents, 0);
    const commission = Math.round((gross * v.commissionPct) / 100);
    const net = gross - commission;

    results.push({
      vendorId: v.id,
      shopName: v.shopName,
      commissionPct: v.commissionPct,
      gross,
      commission,
      net,
      count: due.length,
    });
  }

  results.sort((a, b) => b.net - a.net);
  return results;
}

/** ---------- COD commission due for a single vendor ---------- */
export async function codCommissionDueForVendor(vendorId: string): Promise<{
  vendorId: string;
  commissionPct: number;
  baseSubtotalCents: number;
  commissionCents: number;
  items: { id: string; orderId: string; subtotalCents: number }[];
}> {
  const vos = await db.vendorOrder.findMany({
    where: {
      vendorId,
      status: { not: "CANCELLED" },
      codCommissionSettledAt: null,
      // COD path: either no payment row, or payment exists but is NOT PAID
      order: {
        is: {
          OR: [
            { payment: null },
            { payment: { is: { method: "CARD", status: { not: CARD_OK_STATUS } } } },
          ],
        },
      },
    },
    select: {
      id: true,
      orderId: true,
      subtotalCents: true,
      vendor: { select: { commissionPct: true } },
    },
  });
  type VoCod = (typeof vos)[number];

  const commissionPct = vos[0]?.vendor.commissionPct ?? 0;
  const baseSubtotalCents = vos.reduce((acc: number, vo: VoCod) => acc + vo.subtotalCents, 0);
  const commissionCents = Math.round((baseSubtotalCents * commissionPct) / 100);

  const items = vos.map((vo: VoCod) => ({
    id: vo.id,
    orderId: vo.orderId,
    subtotalCents: vo.subtotalCents,
  }));

  return { vendorId, commissionPct, baseSubtotalCents, commissionCents, items };
}

/** ---------- COD commissions grouped by vendor (admin) ---------- */
export async function codCommissionsByVendor(): Promise<CodCommissionVendorRow[]> {
  const vendors = await db.vendor.findMany({ select: { id: true, shopName: true, commissionPct: true } });
  const out: CodCommissionVendorRow[] = [];

  for (const v of vendors) {
    const d = await codCommissionDueForVendor(v.id);
    if (d.items.length) {
      out.push({
        vendorId: v.id,
        shopName: v.shopName,
        commissionPct: d.commissionPct,
        commissionCents: d.commissionCents,
        count: d.items.length,
      });
    }
  }

  out.sort((a, b) => b.commissionCents - a.commissionCents);
  return out;
}
