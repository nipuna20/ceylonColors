import { requireRole } from "@/lib/rbac";
import { codCommissionsByVendor } from "@/lib/finance";
import { markCodCommissionsReceived } from "./server-action";

export default async function AdminCodPayouts() {
  await requireRole(["ADMIN"]);

  const rows = await codCommissionsByVendor();
  const totals = rows.reduce(
    (acc, r) => {
      acc.commission += r.commissionCents;
      acc.count += r.count;
      return acc;
    },
    { commission: 0, count: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">COD commissions — due</h1>
        {/* Optional: bulk mark all received */}
        {rows.length > 0 && (
          <form action={markCodCommissionsReceived}>
            <input type="hidden" name="vendorId" value="*ALL*" />
            <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
              Mark ALL received
            </button>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          No COD commissions due right now.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left">Vendor</th>
                <th className="px-4 py-2 text-right">Orders</th>
                <th className="px-4 py-2 text-right">Commission %</th>
                <th className="px-4 py-2 text-right">Commission due (LKR)</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.vendorId} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-medium">{r.shopName}</div>
                  </td>
                  <td className="px-4 py-2 text-right">{r.count}</td>
                  <td className="px-4 py-2 text-right">{r.commissionPct}%</td>
                  <td className="px-4 py-2 text-right">
                    {(r.commissionCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <form action={markCodCommissionsReceived}>
                      <input type="hidden" name="vendorId" value={r.vendorId} />
                      <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">
                        Mark received
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              <tr className="border-t bg-gray-50 font-semibold">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right">{totals.count}</td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2 text-right">
                  {(totals.commission / 100).toFixed(2)}
                </td>
                <td className="px-4 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
