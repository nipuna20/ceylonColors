"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

const nameSchema = z.object({ name: z.string().min(1).max(100) });

export async function saveBuyerName(formData: FormData): Promise<void> {
  const session = await requireRole(["BUYER"]);
  const userId = (session.user as any).id;

  const parsed = nameSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) throw new Error("Invalid name");

  await db.user.update({ where: { id: userId }, data: { name: parsed.data.name } });
  revalidatePath("/dashboard/buyer/profile");
}

const addrSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional().nullable(),
  city: z.string().min(1),
  postal: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

export async function saveDefaultAddress(formData: FormData): Promise<void> {
  const session = await requireRole(["BUYER"]);
  const userId = (session.user as any).id;

  const parsed = addrSchema.safeParse({
    line1: String(formData.get("line1") ?? ""),
    line2: (formData.get("line2") as string) || null,
    city: String(formData.get("city") ?? ""),
    postal: (formData.get("postal") as string) || null,
    phone: (formData.get("phone") as string) || null,
  });
  if (!parsed.success) throw new Error("Invalid address");

  const existing = await db.address.findFirst({ where: { userId, isDefault: true } });

  if (existing) {
    await db.address.update({
      where: { id: existing.id },
      data: { ...parsed.data, isDefault: true, country: "LK" },
    });
  } else {
    await db.address.create({
      data: { userId, ...parsed.data, isDefault: true, country: "LK" },
    });
  }

  revalidatePath("/dashboard/buyer/profile");
}
