import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

type Search = { start?: string; end?: string };
function iso(d: Date){return d.toISOString().slice(0,10);}
function defRange(){const e=new Date();const s=new Date();s.setUTCDate(e.getUTCDate()-30);return {start:iso(s),end:iso(e)};}
function toDates(a:string,b:string){const s=new Date(`${a}T00:00:00Z`);const e=new Date(`${b}T00:00:00Z`);const ex=new Date(e);ex.setUTCDate(ex.getUTCDate()+1);return {s,ex};}

export default async function RealtimePage({ searchParams }: { searchParams?: Search }) {
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });
  if (!vendor) return <div className="text-red-600">Vendor profile not found.</div>;

  const pct = vendor.commissionPct ?? 10;
  const {start,end} = defRange();
  const sStr = searchParams?.start || start;
  const eStr = searchParams?.end || end;
  const { s, ex } = toDates(sStr, eStr);

  const inProgress = await db.vendorOrder.findMany({
    where: {
      vendorId: vendor.id,
      status: { in: ["PENDING","PROCESSING","SHIPPED"] },
      order: { is: { createdAt: { gte: s, lt: ex } } },
    },
    orderBy: { id: "desc" },
  });
  const finalized = await db.vendorOrder.findMany({
    where: {
      vendorId: vendor.id,
      status: "COMPLETED",
      order: { is: { createdAt: { gte: s, lt: ex } } },
    },
    orderBy: { id: "desc" },
  });

  const sum = (xs: {subtotalCents:number}[]) => xs.reduce((a,x)=>a+x.subtotalCents,0);
  const sumProg = sum(inProgress), sumFin = sum(finalized);
  const commProg = Math.round(sumProg*pct/100), commFin = Math.round(sumFin*pct/100);
  const netProg = sumProg - commProg, netFin = sumFin - commFin;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Real-time vs finalized</h1>

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
        <Panel title="In progress (PENDING/PROCESSING/SHIPPED)" gross={sumProg} comm={commProg} net={netProg} />
        <Panel title="Finalized (COMPLETED)" gross={sumFin} comm={commFin} net={netFin} />
      </div>

      <p className="text-xs text-gray-600">
        In-progress shows estimated net. Finalized is used for payouts. Commission rate: {pct}%.
      </p>
    </div>
  );
}

function Panel({ title, gross, comm, net }:{title:string; gross:number; comm:number; net:number}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="font-medium mb-3">{title}</div>
      <div className="grid gap-3 md:grid-cols-3">
        <K label="Gross (LKR)" v={(gross/100).toFixed(2)} />
        <K label="Commission (LKR)" v={(comm/100).toFixed(2)} />
        <K label="Net (LKR)" v={(net/100).toFixed(2)} />
      </div>
    </div>
  );
}
function K({label,v}:{label:string;v:string}){return(<div><div className="text-sm text-gray-500">{label}</div><div className="text-xl font-semibold">{v}</div></div>)}
