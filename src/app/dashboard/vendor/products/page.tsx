import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { deleteProduct } from "./actions";

export default async function VendorProducts() {
  const session = await requireRole(["VENDOR"]);
  const userId = (session.user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: userId } });
  const products = await db.product.findMany({
    where: { vendorId: vendor!.id },
    orderBy: { createdAt: "desc" },
    include: { images: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My products</h1>
        <Link href="/dashboard/vendor/products/new" className="rounded-xl bg-blue-600 px-4 py-2 text-white">Add product</Link>
      </div>

      <ul className="grid gap-3">
        {products.map(p => (
          <li key={p.id} className="flex items-center justify-between rounded-xl border bg-white p-4">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-gray-600">LKR {(p.priceCents / 100).toFixed(2)} • Stock {p.stock} • {p.active ? "Active" : "Inactive"}</div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/vendor/products/${p.id}/edit`} className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Edit</Link>
              <form action={deleteProduct}>
                <input type="hidden" name="id" value={p.id} />
                <button className="rounded-xl border px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
