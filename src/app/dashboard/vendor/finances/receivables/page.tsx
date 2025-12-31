import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { cardReceivablesForVendor, type CardReceivables } from "@/lib/finance";


export default async function VendorReceivablesPage() {
  const session = await requireRole(["VENDOR"]);
  const userId = (session.user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: userId } });
  if (!vendor) return <div className="text-red-600">Vendor profile not found.</div>;

  const data: CardReceivables = await cardReceivablesForVendor(vendor.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Card receivables</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Gross (LKR)" value={(data.gross / 100).toFixed(2)} />
        <Stat label={`Commission ${data.commissionPct}% (LKR)`} value={(data.commission / 100).toFixed(2)} />
        <Stat label="Net due (LKR)" value={(data.net / 100).toFixed(2)} />
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="font-medium mb-2">Unpaid card orders ({data.items.length})</div>
        {data.items.length === 0 ? (
          <div className="text-sm text-gray-600">Nothing pending. 🎉</div>
        ) : (
          <ul className="text-sm grid gap-2">
            {data.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between">
                <span>Order #{it.orderId.slice(0, 8)}</span>
                <span>LKR {(it.subtotalCents / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Card receivables are orders where the platform collected the money online. Admin will pay you the{" "}
        <b>net</b> amount (gross minus platform commission).
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
