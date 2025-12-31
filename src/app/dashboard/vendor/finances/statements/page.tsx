import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

function ymDefault() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}`;
}

export default async function VendorStatements() {
  await requireRole(["VENDOR"]);
  const vendor = await db.vendor.findFirst(); // just to fail fast if DB not reachable
  vendor; // noop

  const def = ymDefault();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Statements (CSV)</h1>
      <div className="rounded-2xl border bg-white p-5">
        <form method="get" action="/api/vendor/statement" className="flex items-end gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Month</span>
            <input type="month" name="month" defaultValue={def} className="rounded-xl border px-3 py-2" />
          </label>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-white">Download CSV</button>
        </form>
        <p className="mt-3 text-xs text-gray-600">The CSV includes commission and net for completed orders in that month.</p>
      </div>
    </div>
  );
}
