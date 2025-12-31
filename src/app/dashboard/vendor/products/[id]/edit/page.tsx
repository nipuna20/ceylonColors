import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import ProductForm from "@/components/ProductForm";
import { updateProduct } from "../../actions";

export default async function EditProduct({ params }: { params: { id: string } }) {
  const session = await requireRole(["VENDOR"]);
  const userId = (session.user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: userId } });

  const p = await db.product.findUnique({
    where: { id: params.id },
    include: { images: { take: 1 } },
  });
  if (!p || p.vendorId !== vendor!.id) return <div className="text-red-600">Not found</div>;

  // Load categories for the dropdown
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const initial = {
    id: p.id,
    title: p.title,
    description: p.description ?? "",
    price: p.priceCents / 100,
    stock: p.stock,
    imageUrl: p.images[0]?.url,
    // 👇 pass current category so the select is prefilled
    categoryId: p.categoryId ?? "",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit: {p.title}</h1>
      {/* After we patch ProductForm, it will accept `categories` and `initial.categoryId` */}
      <ProductForm initial={initial} action={updateProduct} submitLabel="Save changes" categories={categories} />
    </div>
  );
}
