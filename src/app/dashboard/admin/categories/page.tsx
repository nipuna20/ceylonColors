import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { createCategory, renameCategory, deleteCategory } from "./actions";

export default async function AdminCategoriesPage() {
  await requireRole(["ADMIN"]);
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Categories</h1>

      <form action={createCategory} className="flex items-center gap-2 rounded-xl border bg-white p-4">
        <input name="name" placeholder="New category name" className="flex-1 rounded-xl border px-3 py-2" />
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-white">Add</button>
      </form>

      <ul className="grid gap-3">
        {categories.map((c) => (
          <li key={c.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-600">/{c.slug} • {c._count.products} products</div>
              </div>
              <div className="flex items-center gap-2">
                <form action={renameCategory} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input name="name" defaultValue={c.name} className="rounded-xl border px-3 py-2 text-sm" />
                  <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Rename</button>
                </form>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="rounded-xl border px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
