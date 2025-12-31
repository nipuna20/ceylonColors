"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

const schema = z.object({
  id: z.string().min(1),
  commissionPct: z.coerce.number().int().min(0).max(100),
});

export async function updateCommissionPct(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const { id, commissionPct } = schema.parse({
    id: formData.get("id"),
    commissionPct: formData.get("commissionPct"),
  });

  await db.vendor.update({
    where: { id },
    data: { commissionPct },
  });

  revalidatePath("/dashboard/admin/vendors/commissions");
}
