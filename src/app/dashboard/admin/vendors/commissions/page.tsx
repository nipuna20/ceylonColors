import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { updateCommissionPct } from "./actions";

export default async function AdminVendorCommissionsPage() {
  await requireRole(["ADMIN"]);

  const vendors = await db.vendor.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, shopName: true, commissionPct: true, isApproved: true, owner: { select: { email: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Vendor commissions</h1>

      <ul className="grid gap-3">
        {vendors.map((v) => (
          <li key={v.id} className="rounded-xl border bg-white p-4 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{v.shopName}</div>
              <div className="text-gray-600">
                {v.owner.email} • {v.isApproved ? "Approved" : "Pending"}
              </div>
            </div>
            <form action={updateCommissionPct} className="flex items-center gap-2">
              <input type="hidden" name="id" value={v.id} />
              <input
                name="commissionPct"
                type="number"
                min={0}
                max={100}
                defaultValue={v.commissionPct ?? 10}
                className="w-24 rounded-xl border px-3 py-2 text-sm"
              />
              <span className="text-sm">%</span>
              <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Save</button>
            </form>
          </li>
        ))}
      </ul>

      <p className="text-xs text-gray-600">
        Note: Vendor earnings = VendorOrder subtotal × (100 − commission%) / 100 for the payout period.
      </p>
    </div>
  );
}
