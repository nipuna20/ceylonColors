import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { z } from "zod";

// Zod schema for product creation
const productSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
  categoryId: z.string().optional(),
  images: z.array(z.string().url()).min(1),
});

/**
 * GET /api/products
 *
 * Returns a list of active products sorted by most recent first. Each
 * product includes its images, vendor shop name and category. This is a
 * public endpoint and does not require authentication.
 */
export async function GET() {
  const products = await db.product.findMany({
    where: { active: true },
    include: {
      images: true,
      vendor: { select: { shopName: true } },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

/**
 * POST /api/products
 *
 * Create a new product. Only users with VENDOR or ADMIN role may call
 * this endpoint. The vendorId is inferred from the currently logged in
 * user's vendor record.
 */
export async function POST(req: Request) {
  try {
    // Ensure the user has permission
    const session = await requireRole(["VENDOR", "ADMIN"]);
    const body = await req.json();
    const data = productSchema.parse(body);

    // Determine the vendor based on the logged in user
    const userId = (session.user as any).id;
    let vendor = await db.vendor.findUnique({ where: { ownerId: userId } });
    if (!vendor) {
      // Fallback: if admin with no vendor, allow specifying vendorId? simple fallback to first vendor
      vendor = await db.vendor.findFirst();
      if (!vendor) {
        return NextResponse.json({ error: "No vendor account found" }, { status: 400 });
      }
    }

    const slugBase = data.title.toLowerCase().replace(/\s+/g, "-");
    const randomPart = Math.random().toString(36).slice(2, 6);
    const slug = `${slugBase}-${randomPart}`;

    const created = await db.product.create({
      data: {
        vendorId: vendor.id,
        title: data.title,
        slug,
        description: data.description ?? null,
        priceCents: data.priceCents,
        stock: data.stock,
        categoryId: data.categoryId ?? null,
        images: {
          create: data.images.map((url, idx) => ({ url, sort: idx })),
        },
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}