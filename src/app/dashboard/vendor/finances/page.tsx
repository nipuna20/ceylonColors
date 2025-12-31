import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

type Search = { start?: string; end?: string };

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - 30);
  return { start: isoDate(start), end: isoDate(end) };
}
function rangeToDates(startStr: string, endStr: string) {
  const start = new Date(`${startStr}T00:00:00.000Z`);
  const end = new Date(`${endStr}T00:00:00.000Z`);
  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, end, endExclusive };
}

export default async function VendorFinancesPage({ searchParams }: { searchParams?: Search }) {
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;

  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });
  if (!vendor) return <div className="text-red-600">Vendor profile not found.</div>;

  const { start: defStart, end: defEnd } = defaultRange();
  const startStr = searchParams?.start || defStart;
  const endStr = searchParams?.end || defEnd;
  const { start, end, endExclusive } = rangeToDates(startStr, endStr);

  // We consider earnings based on COMPLETED VendorOrders in the selected period
  const voAgg = await db.vendorOrder.aggregate({
    where: {
      vendorId: vendor.id,
      status: "COMPLETED",
      order: { is: { createdAt: { gte: start, lt: endExclusive } } },
    },
    _sum: { subtotalCents: true },
    _count: { _all: true },
  });

  const subtotalCents = voAgg._sum.subtotalCents ?? 0;
  const commissionPct = vendor.commissionPct ?? 10;
  const commissionCents = Math.round(subtotalCents * commissionPct / 100);
  const netCents = subtotalCents - commissionCents;

  // Payouts created by admin for THIS exact range (start,end)
  const payouts = await db.payout.findMany({
    where: { vendorId: vendor.id, periodStart: start, periodEnd: end },
    orderBy: { createdAt: "desc" },
  });

  const sums = payouts.reduce(
    (acc, p) => {
      if (p.status === "PAID") acc.paid += p.amountCents;
      else if (p.status === "HOLD") acc.hold += p.amountCents;
      else acc.due += p.amountCents;
      acc.count += 1;
      return acc;
    },
    { paid: 0, due: 0, hold: 0, count: 0 }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Finances</h1>

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

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Gross sales (LKR)" value={(subtotalCents/100).toFixed(2)} />
        <Kpi label={`Commission (${commissionPct}%)`} value={(commissionCents/100).toFixed(2)} />
        <Kpi label="Net earnings (LKR)" value={(netCents/100).toFixed(2)} />
        <Kpi label="Completed orders" value={voAgg._count._all} />
      </div>

      {/* Payout status summary */}
      <div className="rounded-2xl border bg-white p-5 grid gap-4 md:grid-cols-3">
        <Kpi label="Paid to you (LKR)" value={(sums.paid/100).toFixed(2)} />
        <Kpi label="Due (LKR)" value={(sums.due/100).toFixed(2)} />
        <Kpi label="On hold (LKR)" value={(sums.hold/100).toFixed(2)} />
      </div>

      {/* Payout rows (for this exact period) */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="mb-3 font-medium">
          Payouts for {startStr} → {endStr} ({sums.count})
        </div>
        {payouts.length === 0 ? (
          <div className="text-sm text-gray-600">
            No payout rows yet for this period. Once admin generates payouts, they’ll appear here.
          </div>
        ) : (
          <ul className="grid gap-2">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl border p-3">
                <div className="text-sm">
                  <div className="font-medium">
                    Period: {isoDate(p.periodStart)} → {isoDate(p.periodEnd)}
                  </div>
                  <div className="text-gray-600">Status: <b>{p.status}</b></div>
                </div>
                <div className="text-lg font-semibold">LKR {(p.amountCents/100).toFixed(2)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tip */}
      <p className="text-xs text-gray-600">
        Note: Net earnings = Completed VendorOrder subtotal − platform commission. Payout rows are created by admin;
        “Paid / Due / Hold” reflect your payout status for the selected period.
      </p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
