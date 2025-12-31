"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { hash } from "bcrypt";

const nameSchema = z.object({ name: z.string().min(1).max(100) });
export async function saveAdminName(formData: FormData): Promise<void> {
  const session = await requireRole(["ADMIN"]);
  const userId = (session.user as any).id;

  const parsed = nameSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) throw new Error("Invalid name");

  await db.user.update({ where: { id: userId }, data: { name: parsed.data.name } });
  revalidatePath("/dashboard/admin/profile");
}

const pwSchema = z.object({ password: z.string().min(6).max(100) });
export async function changeAdminPassword(formData: FormData): Promise<void> {
  const session = await requireRole(["ADMIN"]);
  const userId = (session.user as any).id;

  const parsed = pwSchema.safeParse({ password: String(formData.get("password") ?? "") });
  if (!parsed.success) throw new Error("Invalid password");

  const passwordHash = await hash(parsed.data.password, 10);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  revalidatePath("/dashboard/admin/profile");
}
