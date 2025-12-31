"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { slugifyLocal as slugify } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  shopName: z.string().min(2),
  phone: z.string().optional(),
  brn: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankSwift: z.string().optional(),
});

export async function createVendorAccount(formData: FormData) {
  try {
    const data = schema.parse(Object.fromEntries(formData.entries()));
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) return { error: "Email already in use" };

    const passwordHash = await hash(data.password, 10);
    const user = await db.user.create({
      data: { email: data.email, name: data.name, passwordHash, role: "VENDOR" },
    });

    const slug = slugify(data.shopName, { lower: true, strict: true }) + "-" + user.id.slice(0, 6);
    await db.vendor.create({
      data: {
        ownerId: user.id,
        shopName: data.shopName,
        slug,
        phone: data.phone,
        brn: data.brn,
        addressLine1: data.addressLine1,
        city: data.city,
        payoutMethod: "BANK",
        bankName: data.bankName,
        bankAccountName: data.bankAccountName,
        bankAccountNo: data.bankAccountNo,
        bankSwift: data.bankSwift,
        status: "PENDING",
        isApproved: false,          // keep old boolean in sync
        kycSubmittedAt: new Date(),
      },
    });

    // Optionally email the admins here…
    console.log("[vendor-signup] new application:", { email: user.email, shop: data.shopName });

    return { ok: true };
  } catch (e: any) {
    return { error: e?.message ?? "Failed" };
  }
}
