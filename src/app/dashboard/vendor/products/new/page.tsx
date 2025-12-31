import ProductForm from "@/components/ProductForm";
import { createProduct } from "../actions";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

export default async function NewProduct() {
  await requireRole(["VENDOR"]);

  // Load categories for the dropdown
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Add product</h1>
      {/* After we patch ProductForm, it will accept `categories` */}
      <ProductForm action={createProduct} submitLabel="Create" categories={categories} />
    </div>
  );
}
