"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { slugifyLocal as slugify } from "@/lib/slug";

const schema = z.object({
  shopName: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
});

export async function saveVendorProfile(formData: FormData) {
  const { user } = await requireRole(["VENDOR"]);
  const uid = (user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });
  if (!vendor) throw new Error("Vendor profile not found");

  const parsed = schema.parse({
    shopName: String(formData.get("shopName") ?? ""),
    slug: slugify(String(formData.get("slug") ?? "")),
    description: (formData.get("description") as string) || null,
    logoUrl: (formData.get("logoUrl") as string) || null,
    coverUrl: (formData.get("coverUrl") as string) || null,
  });

  await db.vendor.update({ where: { id: vendor.id }, data: parsed });
  revalidatePath("/dashboard/vendor/profile");
}
