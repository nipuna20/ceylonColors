import { requireRole } from "@/lib/rbac";
import { codCommissionsByVendor } from "@/lib/finance";
import { markVendorCodSettled } from "./server-actions";

export default async function AdminCodSettlementsPage() {
  await requireRole(["ADMIN"]);
  const rows = await codCommissionsByVendor();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">COD commissions to collect (vendor → platform)</h1>

      <table className="w-full text-sm border bg-white rounded-xl overflow-hidden">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="p-3 text-left">Vendor</th>
            <th className="p-3 text-right">Commission (LKR)</th>
            <th className="p-3 text-right">Items</th>
            <th className="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nothing outstanding 🎉</td></tr>
          ) : rows.map(r => (
            <tr key={r.vendorId} className="border-t">
              <td className="p-3">{r.shopName} ({r.commissionPct}%)</td>
              <td className="p-3 text-right">{(r.commissionCents/100).toFixed(2)}</td>
              <td className="p-3 text-right">{r.count}</td>
              <td className="p-3 text-right">
                <form action={markVendorCodSettled}>
                  <input type="hidden" name="vendorId" value={r.vendorId} />
                  <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Mark received</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-gray-500">
        This marks the COD commission for all currently outstanding vendor-orders as settled (timestamped). You can run it per vendor when you receive their remittance.
      </p>
    </div>
  );
}
