import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { createPayouts, setPayoutStatus, deletePayout } from "./actions";

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function money(cents: number) {
  return `LKR ${(cents / 100).toFixed(2)}`;
}
function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - 30);
  return { start: fmtDate(start), end: fmtDate(end) };
}
function toRange(startStr: string, endStr: string) {
  const start = new Date(`${startStr}T00:00:00.000Z`);
  const end = new Date(`${endStr}T00:00:00.000Z`);
  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, end, endExclusive };
}
function endExclusiveOf(d: Date) {
  const e = new Date(d);
  e.setUTCDate(e.getUTCDate() + 1);
  return e;
}

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams?: { start?: string; end?: string };
}) {
  await requireRole(["ADMIN"]);

  const { start: defStart, end: defEnd } = defaultRange();
  const startStr = (searchParams?.start || defStart)!;
  const endStr = (searchParams?.end || defEnd)!;

  const { start, end, endExclusive } = toRange(startStr, endStr);

  // 1) PREVIEW of payables (from COMPLETED vendor orders in period)
  const vos = await db.vendorOrder.findMany({
    where: {
      status: "COMPLETED",
      order: { is: { createdAt: { gte: start, lt: endExclusive } } },
    },
    include: {
      vendor: { select: { id: true, shopName: true, commissionPct: true } },
    },
  });

  // Aggregate per vendor with full breakdown
  const byVendor = new Map<
    string,
    {
      shopName: string;
      commissionPct: number;
      subtotalCents: number;
      commissionCents: number;
      netCents: number;
      count: number;
    }
  >();

  for (const vo of vos) {
    const commissionPct = vo.vendor.commissionPct ?? 10;

    const prev =
      byVendor.get(vo.vendor.id) ?? {
        shopName: vo.vendor.shopName,
        commissionPct,
        subtotalCents: 0,
        commissionCents: 0,
        netCents: 0,
        count: 0,
      };

    prev.subtotalCents += vo.subtotalCents;
    prev.count += 1;
    prev.commissionCents = Math.round((prev.subtotalCents * commissionPct) / 100);
    prev.netCents = prev.subtotalCents - prev.commissionCents;

    byVendor.set(vo.vendor.id, prev);
  }

  const preview = Array.from(byVendor.entries()).map(([vendorId, v]) => ({
    vendorId,
    ...v,
  }));

  const previewTotals = preview.reduce(
    (acc, v) => {
      acc.subtotal += v.subtotalCents;
      acc.commission += v.commissionCents;
      acc.vendorDue += v.netCents;
      acc.count += v.count;
      return acc;
    },
    { subtotal: 0, commission: 0, vendorDue: 0, count: 0 }
  );

  // 2) EXISTING payouts for this exact (start,end) period
  const payouts = await db.payout.findMany({
    where: { periodStart: start, periodEnd: end },
    include: { vendor: { select: { shopName: true, commissionPct: true, id: true } } },
    orderBy: { createdAt: "desc" },
  });

  const payoutSums = payouts.reduce(
    (acc, p) => {
      if (p.status === "PAID") acc.paid += p.amountCents;
      else if (p.status === "HOLD") acc.hold += p.amountCents;
      else acc.due += p.amountCents; // treat others as DUE
      acc.count += 1;
      return acc;
    },
    { paid: 0, due: 0, hold: 0, count: 0 }
  );

  // 3) COMMISSION RECEIVED = commission for payouts marked PAID.
  // Recompute vendor subtotal for each paid payout's vendor in that payout's period,
  // then apply that vendor's commissionPct at the time.
  const paidPayouts = payouts.filter((p) => p.status === "PAID");

  const paidCommissionPieces = await Promise.all(
    paidPayouts.map(async (p) => {
      const subAgg = await db.vendorOrder.aggregate({
        where: {
          vendorId: p.vendorId,
          status: "COMPLETED",
          order: {
            is: {
              createdAt: { gte: p.periodStart, lt: endExclusiveOf(p.periodEnd) },
            },
          },
        },
        _sum: { subtotalCents: true },
      });
      const subtotal = subAgg._sum.subtotalCents ?? 0;
      const pct = p.vendor.commissionPct ?? 10;
      return Math.round((subtotal * pct) / 100);
    })
  );

  const commissionReceivedCents = paidCommissionPieces.reduce((a, b) => a + b, 0);
  const commissionToReceiveCents = Math.max(
    0,
    previewTotals.commission - commissionReceivedCents
  );

  const totalDue = previewTotals.vendorDue;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Payouts</h1>

      <div className="flex gap-2 text-sm">
        <a href="/dashboard/admin/payouts" className="rounded-lg border px-3 py-1.5">
          History
        </a>
        <a href="/dashboard/admin/payouts/online" className="rounded-lg border px-3 py-1.5">
          Online (Card)
        </a>
        <a href="/dashboard/admin/payouts/cod" className="rounded-lg border px-3 py-1.5">
          COD commissions
        </a>
      </div>

      {/* Period filter */}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Start</span>
          <input type="date" name="start" defaultValue={startStr} className="rounded-xl border px-3 py-2" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">End</span>
          <input type="date" name="end" defaultValue={endStr} className="rounded-xl border px-3 py-2" />
        </label>
        <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Apply</button>
      </form>

      {/* Preview payable amounts */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-medium">
            Payables for {startStr} → {endStr}
          </div>
          <div className="text-sm text-gray-600">Total Vendor Due: {money(totalDue)}</div>
        </div>

        {preview.length === 0 ? (
          <div className="text-sm text-gray-600">No completed vendor orders in this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Commission %</th>
                  <th className="px-4 py-3">Gross</th>
                  <th className="px-4 py-3">Admin Commission</th>
                  <th className="px-4 py-3">Vendor Net</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((v) => (
                  <tr key={v.vendorId} className="border-t">
                    <td className="px-4 py-3">{v.shopName}</td>
                    <td className="px-4 py-3">{v.count}</td>
                    <td className="px-4 py-3">{v.commissionPct}%</td>
                    <td className="px-4 py-3">{money(v.subtotalCents)}</td>
                    <td className="px-4 py-3">{money(v.commissionCents)}</td>
                    <td className="px-4 py-3 font-medium">{money(v.netCents)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="font-semibold">
                  <td className="px-4 py-3">Totals</td>
                  <td className="px-4 py-3">{previewTotals.count}</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">{money(previewTotals.subtotal)}</td>
                  <td className="px-4 py-3">{money(previewTotals.commission)}</td>
                  <td className="px-4 py-3">{money(previewTotals.vendorDue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Create payout rows for this period */}
        <form action={createPayouts} className="mt-4">
          <input type="hidden" name="start" value={startStr} />
          <input type="hidden" name="end" value={endStr} />
          <button
            className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            disabled={preview.length === 0}
          >
            Create DUE payouts for this period
          </button>
        </form>
      </div>

      {/* Commission summary */}
      <div className="rounded-2xl border bg-white p-5 grid gap-4 md:grid-cols-3">
        <Stat label="Commission (period total)" value={money(previewTotals.commission)} />
        <Stat label="Commission received (PAID)" value={money(commissionReceivedCents)} />
        <Stat label="Commission to receive" value={money(commissionToReceiveCents)} />
      </div>

      {/* Existing payouts for this exact period */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="mb-3 font-medium">
          Existing payouts ({payoutSums.count}) — DUE: {money(payoutSums.due)} • PAID: {money(payoutSums.paid)} • HOLD: {money(payoutSums.hold)}
        </div>
        {payouts.length === 0 ? (
          <div className="text-sm text-gray-600">No payout rows created yet for this period.</div>
        ) : (
          <ul className="grid gap-2">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl border p-3">
                <div className="text-sm">
                  <div className="font-medium">{p.vendor.shopName}</div>
                  <div className="text-gray-600">
                    Period: {fmtDate(p.periodStart)} → {fmtDate(p.periodEnd)} • Amount: {money(p.amountCents)} • Status: <b>{p.status}</b>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={setPayoutStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="PAID" />
                    <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Mark PAID</button>
                  </form>
                  <form action={setPayoutStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="HOLD" />
                    <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Hold</button>
                  </form>
                  <form action={setPayoutStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="DUE" />
                    <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Set DUE</button>
                  </form>
                  <form action={deletePayout}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="rounded-xl border px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
