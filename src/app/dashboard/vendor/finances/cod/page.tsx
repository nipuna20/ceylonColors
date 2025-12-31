import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { codCommissionDueForVendor } from "@/lib/finance";

export default async function VendorCodCommissionPage() {
  const session = await requireRole(["VENDOR"]);
  const userId = (session.user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: userId } });
  if (!vendor) return <div className="text-red-600">Vendor profile not found.</div>;

  const d = await codCommissionDueForVendor(vendor.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">COD commission due</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Base subtotal (LKR)" value={(d.baseSubtotalCents / 100).toFixed(2)} />
        <Stat label={`Commission ${d.commissionPct}% (LKR)`} value={(d.commissionCents / 100).toFixed(2)} />
        <Stat label="Items" value={d.items.length} />
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="font-medium mb-2">Orders included ({d.items.length})</div>
        {d.items.length === 0 ? (
          <div className="text-sm text-gray-600">No outstanding commission.</div>
        ) : (
          <ul className="text-sm grid gap-2">
            {d.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between">
                <span>Order #{it.orderId.slice(0, 8)}</span>
                <span>Subtotal LKR {(it.subtotalCents / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-500">
        COD commission is the amount you owe the platform for cash-on-delivery orders. Once you remit, admin will mark
        them as settled and they will disappear from this list.
      </p>
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
