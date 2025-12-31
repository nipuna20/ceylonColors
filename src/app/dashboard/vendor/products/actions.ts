"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { z } from "zod";
// replace: import slugify from "slugify";
import { slugifyLocal as slugify } from "@/lib/slug";


const productSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().optional().nullable(),
});

export async function createProduct(_prev: any, formData: FormData) {
  const session = await requireRole(["VENDOR"]);
  const userId = (session.user as any).id;

  const vendor = await db.vendor.findUnique({ where: { ownerId: userId } });
  if (!vendor) throw new Error("Vendor profile not found.");

  const raw = Object.fromEntries(formData.entries());
  const data = productSchema.parse({
    title: raw.title,
    description: raw.description,
    price: raw.price,
    stock: raw.stock,
    imageUrl: raw.imageUrl,
    categoryId: raw.categoryId || null,
  });

  const product = await db.product.create({
    data: {
      vendorId: vendor.id,
      title: data.title,
      slug: slugify(String(data.title), { lower: true, strict: true }),
      description: data.description,
      priceCents: Math.round(data.price * 100),
      stock: data.stock,
      categoryId: data.categoryId ?? undefined,
      active: true,
      images: data.imageUrl ? { create: [{ url: data.imageUrl, alt: data.title }] } : undefined,
    },
  });

  revalidatePath("/dashboard/vendor/products");
  revalidatePath("/products");
  return { ok: true, id: product.id };
}

export async function updateProduct(_prev: any, formData: FormData) {
  const session = await requireRole(["VENDOR"]);
  const userId = (session.user as any).id;

  const vendor = await db.vendor.findUnique({ where: { ownerId: userId } });
  if (!vendor) throw new Error("Vendor profile not found.");

  const id = String(formData.get("id"));
  const raw = Object.fromEntries(formData.entries());
  const data = productSchema.parse({
    title: raw.title,
    description: raw.description,
    price: raw.price,
    stock: raw.stock,
    imageUrl: raw.imageUrl,
    categoryId: raw.categoryId || null,
  });

  // include the first image id so TS knows images exist
  const product = await db.product.findUnique({
    where: { id },
    include: { images: { select: { id: true }, take: 1 } },
  });
  if (!product || product.vendorId !== vendor.id) throw new Error("Not your product.");

  await db.product.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      priceCents: Math.round(data.price * 100),
      stock: data.stock,
      categoryId: data.categoryId ?? undefined,
    },
  });

  // upsert the first image in a safe separate step
  if (data.imageUrl) {
    const firstImageId = product.images[0]?.id;
    if (firstImageId) {
      await db.productImage.update({
        where: { id: firstImageId },
        data: { url: data.imageUrl, alt: data.title },
      });
    } else {
      await db.productImage.create({
        data: { productId: id, url: data.imageUrl, alt: data.title },
      });
    }
  }

  revalidatePath("/dashboard/vendor/products");
  revalidatePath("/products");
  return { ok: true, id };
}

// NOTE: <form action={...}> expects (fd) => Promise<void> or void.
// Return nothing here to satisfy TS.
export async function deleteProduct(formData: FormData): Promise<void> {
  const session = await requireRole(["VENDOR"]);
  const userId = (session.user as any).id;

  const vendor = await db.vendor.findUnique({ where: { ownerId: userId } });
  if (!vendor) throw new Error("Vendor profile not found.");

  const id = String(formData.get("id"));
  const product = await db.product.findUnique({ where: { id } });
  if (!product || product.vendorId !== vendor.id) throw new Error("Not your product.");

  await db.product.delete({ where: { id } });
  revalidatePath("/dashboard/vendor/products");
  revalidatePath("/products");
  // no return (so the type is Promise<void>)
}
