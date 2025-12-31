import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { setProductActive } from "../actions";

export default async function AdminProducts() {
  await requireRole(["ADMIN"]);
  const products = await db.product.findMany({ include: { vendor: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">All products</h1>
      <ul className="grid gap-3">
        {products.map(p => (
          <li key={p.id} className="flex items-center justify-between rounded-xl border bg-white p-4">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-gray-600">Vendor: {p.vendor.shopName} • LKR {(p.priceCents/100).toFixed(2)} • {p.active ? "Active" : "Inactive"}</div>
            </div>
            <form action={setProductActive}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="active" value={(!p.active).toString()} />
              <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">
                {p.active ? "Disable" : "Enable"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
