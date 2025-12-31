import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

export default async function VendorOverview() {
  const session = await requireRole(["VENDOR"]);
  const userId = (session.user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: userId } });

  const [productCount, voStats] = await Promise.all([
    db.product.count({ where: { vendorId: vendor!.id } }),
    db.vendorOrder.aggregate({
      where: { vendorId: vendor!.id, status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } },
      _sum: { subtotalCents: true },
      _count: { _all: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Vendor overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Products" value={productCount} />
        <Stat label="Orders" value={voStats._count._all} />
        <Stat label="Revenue (LKR)" value={(voStats._sum.subtotalCents ?? 0) / 100} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
