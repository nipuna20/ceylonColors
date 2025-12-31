import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import Link from "next/link";

function d(d: Date) { return d.toISOString().slice(0,10); }

export default async function VendorOrderDetail({ params }: { params: { id: string } }) {
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;

  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });
  if (!vendor) return <div className="text-red-600">Vendor profile not found.</div>;

  const vo = await db.vendorOrder.findUnique({
    where: { id: params.id },
    include: {
      vendor: { select: { id: true, shopName: true, commissionPct: true } },
      order: {
        include: {
          buyer: { select: { email: true } },
          items: { include: { product: { select: { title: true, vendorId: true } } } },
        },
      },
    },
  });
  if (!vo || vo.vendorId !== vendor.id) return <div className="text-red-600">Order not found.</div>;

  // Filter only this vendor's items
  const items = vo.order.items.filter(i => i.product.vendorId === vendor.id);

  const subtotalCents = vo.subtotalCents;
  const pct = vo.vendor.commissionPct ?? 10;
  const commissionCents = Math.round(subtotalCents * pct / 100);
  const netCents = subtotalCents - commissionCents;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Order #{vo.orderId.slice(0,8)}</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Status" value={vo.status} />
        <Stat label="Subtotal (LKR)" value={(subtotalCents/100).toFixed(2)} />
        <Stat label={`Commission (${pct}%)`} value={(commissionCents/100).toFixed(2)} />
        <Stat label="Net to you (LKR)" value={(netCents/100).toFixed(2)} />
        <Stat label="Buyer" value={vo.order.buyer?.email ?? "—"} />
        <Stat label="Date" value={d(vo.order.createdAt)} />
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="mb-3 font-medium">Items from this order</div>
        <ul className="grid gap-2">
          {items.map(i => (
            <li key={i.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
              <span>{i.qty}× {i.product.title}</span>
              <span>LKR {(i.priceCents/100).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link href="/dashboard/vendor/orders" className="inline-block rounded-xl border px-4 py-2">Back to orders</Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
