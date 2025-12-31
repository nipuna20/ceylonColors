import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function VendorPayoutsPage() {
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;

  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });
  if (!vendor) return <div className="text-red-600">Vendor profile not found.</div>;

  const payouts = await db.payout.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
  });

  const totals = payouts.reduce(
    (acc, p) => {
      acc.all += p.amountCents;
      if (p.status === "PAID") acc.paid += p.amountCents;
      if (p.status === "DUE") acc.due += p.amountCents;
      if (p.status === "HOLD") acc.hold += p.amountCents;
      return acc;
    },
    { all: 0, paid: 0, due: 0, hold: 0 }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My payouts</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total (LKR)" value={(totals.all / 100).toFixed(2)} />
        <Stat label="Paid (LKR)" value={(totals.paid / 100).toFixed(2)} />
        <Stat label="Due/Hold (LKR)" value={(((totals.due + totals.hold) / 100)).toFixed(2)} />
      </div>

      {payouts.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
          No payouts yet. Once your vendor orders are completed and admin generates payouts for a period,
          they will appear here.
        </div>
      ) : (
        <ul className="grid gap-3">
          {payouts.map((p) => (
            <li key={p.id} className="rounded-xl border bg-white p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">
                  Period: {fmt(p.periodStart)} → {fmt(p.periodEnd)}
                </div>
                <div className="text-gray-600">
                  Created: {fmt(p.createdAt)} • Status: <b>{p.status}</b>
                </div>
              </div>
              <div className="text-lg font-semibold">LKR {(p.amountCents / 100).toFixed(2)}</div>
            </li>
          ))}
        </ul>
      )}
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
