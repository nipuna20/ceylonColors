import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

type Search = { start?: string; end?: string };
function iso(d: Date){return d.toISOString().slice(0,10);}
function defR(){const e=new Date();const s=new Date();s.setUTCDate(e.getUTCDate()-30);return {start:iso(s),end:iso(e)};}
function rng(a:string,b:string){const s=new Date(`${a}T00:00:00Z`);const e=new Date(`${b}T00:00:00Z`);const ex=new Date(e);ex.setUTCDate(ex.getUTCDate()+1);return {s,ex};}

export default async function VendorCODPage({ searchParams }: { searchParams?: Search }) {
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });
  if (!vendor) return <div className="text-red-600">Vendor profile not found.</div>;

  const { start, end } = defR();
  const sStr = searchParams?.start || start;
  const eStr = searchParams?.end || end;
  const { s, ex } = rng(sStr, eStr);

  // For COD we separate "to collect" (in-progress) vs "collected" (completed)
  const inProg = await db.vendorOrder.aggregate({
    where: {
      vendorId: vendor.id,
      status: { in: ["PENDING","PROCESSING","SHIPPED"] },
      order: { is: { createdAt: { gte: s, lt: ex } } },
    },
    _sum: { subtotalCents: true },
  });
  const completed = await db.vendorOrder.aggregate({
    where: {
      vendorId: vendor.id,
      status: "COMPLETED",
      order: { is: { createdAt: { gte: s, lt: ex } } },
    },
    _sum: { subtotalCents: true },
  });

  const pct = vendor.commissionPct ?? 10;
  const toCollect = inProg._sum.subtotalCents ?? 0;
  const collected = completed._sum.subtotalCents ?? 0;

  const commissionOnCollected = Math.round(collected * pct / 100);
  const vendorNetOnCollected = collected - commissionOnCollected;

  // Cross-check payouts paid in this window (net amounts)
  const paidPayouts = await db.payout.aggregate({
    where: { vendorId: vendor.id, periodStart: new Date(sStr), periodEnd: new Date(eStr), status: "PAID" },
    _sum: { amountCents: true },
  });
  const paidNet = paidPayouts._sum.amountCents ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">COD reconciliation</h1>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Start</span>
          <input type="date" name="start" defaultValue={sStr} className="rounded-xl border px-3 py-2" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">End</span>
          <input type="date" name="end" defaultValue={eStr} className="rounded-xl border px-3 py-2" />
        </label>
        <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Apply</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        <Box title="To collect (in-progress orders)" items={[
          { k: "Gross COD", v: (toCollect/100).toFixed(2) },
          { k: `Est. commission (${pct}%)`, v: (Math.round(toCollect*pct/100)/100).toFixed(2) },
          { k: "Est. net", v: ((toCollect - Math.round(toCollect*pct/100))/100).toFixed(2) },
        ]} />
        <Box title="Collected (completed orders)" items={[
          { k: "Gross COD", v: (collected/100).toFixed(2) },
          { k: `Commission (${pct}%)`, v: (commissionOnCollected/100).toFixed(2) },
          { k: "Net to you", v: (vendorNetOnCollected/100).toFixed(2) },
          { k: "Payouts PAID (net)", v: (paidNet/100).toFixed(2) },
        ]} />
      </div>

      <p className="text-xs text-gray-600">
        For COD, customers pay you directly. “Payouts PAID” shows any platform settlements
        (if used). Commission represents what the platform keeps from your completed orders.
      </p>
    </div>
  );
}

function Box({ title, items }:{ title:string; items:{k:string; v:string}[] }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="font-medium mb-3">{title}</div>
      <ul className="grid gap-2">
        {items.map(it => (
          <li key={it.k} className="flex items-center justify-between rounded-xl border p-3 text-sm">
            <span>{it.k}</span>
            <span className="font-semibold">LKR {it.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
