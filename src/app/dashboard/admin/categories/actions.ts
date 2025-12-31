"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { slugifyLocal as slugify } from "@/lib/slug";

const catSchema = z.object({
  name: z.string().min(2).max(60),
});

export async function createCategory(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const name = String(formData.get("name") ?? "").trim();
  const { name: parsed } = catSchema.parse({ name });
  await db.category.create({ data: { name: parsed, slug: slugify(parsed) } });
  revalidatePath("/dashboard/admin/categories");
}

export async function renameCategory(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const { name: parsed } = catSchema.parse({ name });
  await db.category.update({ where: { id }, data: { name: parsed, slug: slugify(parsed) } });
  revalidatePath("/dashboard/admin/categories");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  // Optional safety: prevent delete if products exist
  const count = await db.product.count({ where: { categoryId: id } });
  if (count > 0) throw new Error("Cannot delete: category has products");
  await db.category.delete({ where: { id } });
  revalidatePath("/dashboard/admin/categories");
}
