import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";  // Correct named import
import { z } from "zod";
import { getServerSession } from "next-auth";

// Schema for order creation
const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      qty: z.number().int().positive(),
    })
  ).min(1),
});

/**
 * POST /api/orders
 *
 * Create a new order for the authenticated buyer. The request body
 * contains an array of items with product and variant identifiers and
 * quantities. The totals are recomputed on the server to prevent
 * tampering. OrderItems and VendorOrders are created in a transaction.
 */
export async function POST(req: Request) {
  // Authenticate the user
  const session = await getServerSession(authOptions);  // Using authOptions here
  if (!session?.user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const buyerId = (session.user as any).id;

  try {
    const body = await req.json();
    const data = orderSchema.parse(body);

    // Fetch products referenced in the order
    const products = await db.product.findMany({
      where: { id: { in: data.items.map((i) => i.productId) } },
      include: { variants: true, vendor: true },
    });
    // Compute totals and prepare order items
    let totalCents = 0;
    const orderItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Invalid product ${item.productId}`);
      }
      let price = product.priceCents;
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new Error(`Invalid variant ${item.variantId}`);
        }
        price += variant.priceDeltaCents;
      }
      totalCents += price * item.qty;
      return {
        productId: product.id,
        variantId: item.variantId ?? null,
        qty: item.qty,
        priceCents: price,
      };
    });

    // Create order and related records transactionally
    const order = await db.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          buyerId,
          status: "PENDING",
          totalCents,
        },
      });
      // Create order items
      await tx.orderItem.createMany({
        data: orderItems.map((oi) => ({ ...oi, orderId: createdOrder.id })),
      });
      // Split subtotals per vendor and create vendor orders
      const byVendor = new Map<string, number>();
      for (const oi of orderItems) {
        const p = products.find((pr) => pr.id === oi.productId)!;
        const subtotal = (byVendor.get(p.vendorId) ?? 0) + oi.priceCents * oi.qty;
        byVendor.set(p.vendorId, subtotal);
      }
      for (const [vendorId, subtotal] of byVendor) {
        await tx.vendorOrder.create({
          data: { vendorId, orderId: createdOrder.id, subtotalCents: subtotal, status: "PENDING" },
        });
      }
      return createdOrder;
    });
    return NextResponse.json({ id: order.id, totalCents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
