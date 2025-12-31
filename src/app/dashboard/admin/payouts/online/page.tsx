import { requireRole } from "@/lib/rbac";
import { cardPayablesByVendor } from "@/lib/finance";
import { createOnlinePayouts } from "./server-actions";

export default async function AdminOnlinePayouts() {
  await requireRole(["ADMIN"]);
  const rows = await cardPayablesByVendor();
  const totals = rows.reduce(
    (acc, r) => {
      acc.gross += r.gross;
      acc.commission += r.commission;
      acc.net += r.net;
      acc.count += r.count;
      return acc;
    },
    { gross: 0, commission: 0, net: 0, count: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Online (Card) payouts — due</h1>
        {rows.length > 0 && (
          <form action={createOnlinePayouts}>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Create payouts from current card orders
            </button>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          Nothing to pay right now. When card payments are marked <b>PAID</b>,
          they’ll appear here until you generate payouts.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left">Vendor</th>
                <th className="px-4 py-2 text-right">Orders</th>
                <th className="px-4 py-2 text-right">Gross (LKR)</th>
                <th className="px-4 py-2 text-right">Commission {/** pct per vendor */}</th>
                <th className="px-4 py-2 text-right">Net payable (LKR)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.vendorId} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-medium">{r.shopName}</div>
                    <div className="text-xs text-gray-500">{r.commissionPct}% commission</div>
                  </td>
                  <td className="px-4 py-2 text-right">{r.count}</td>
                  <td className="px-4 py-2 text-right">{(r.gross / 100).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">-{(r.commission / 100).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-semibold">{(r.net / 100).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="border-t bg-gray-50 font-semibold">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right">{totals.count}</td>
                <td className="px-4 py-2 text-right">{(totals.gross / 100).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">-{(totals.commission / 100).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{(totals.net / 100).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
