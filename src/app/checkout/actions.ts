"use server";

import { db } from "@/lib/db";
import { getCart, clearCart } from "@/lib/cart";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** COD / place order then show buyer detail page */
export async function placeOrder(formData: FormData): Promise<void> {
  const session = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
  const userId = (session.user as any).id;

  const shipping = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    line1: String(formData.get("line1") ?? ""),
    line2: String(formData.get("line2") ?? ""),
    city: String(formData.get("city") ?? ""),
    postal: String(formData.get("postal") ?? ""),
    country: "LK",
  };

  const cart = await getCart();
  if (cart.items.length === 0) redirect("/cart");

  const products = await db.product.findMany({
    where: { id: { in: cart.items.map(i => i.productId) }, active: true },
    select: { id: true, vendorId: true, title: true, priceCents: true, stock: true },
  });

  const items = cart.items.map(i => {
    const p = products.find(pp => pp.id === i.productId);
    if (!p) throw new Error("Some items are unavailable.");
    if (p.stock < i.qty) throw new Error(`Not enough stock for ${p.title}`);
    return { productId: p.id, qty: i.qty, priceCents: p.priceCents, vendorId: p.vendorId };
  });

  const totalCents = items.reduce((sum, it) => sum + it.priceCents * it.qty, 0);

  const order = await db.$transaction(async tx => {
    const ord = await tx.order.create({
      data: { buyerId: userId, status: "PENDING", totalCents, shippingAddr: shipping as any },
    });

    await tx.orderItem.createMany({
      data: items.map(it => ({ orderId: ord.id, productId: it.productId, qty: it.qty, priceCents: it.priceCents })),
    });

    for (const it of items) {
      await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.qty } } });
    }

    const byVendor = new Map<string, number>();
    for (const it of items) byVendor.set(it.vendorId, (byVendor.get(it.vendorId) ?? 0) + it.priceCents * it.qty);
    for (const [vendorId, subtotalCents] of byVendor) {
      await tx.vendorOrder.create({ data: { vendorId, orderId: ord.id, status: "PENDING", subtotalCents } });
    }

    return ord;
  });

  await clearCart();
  revalidatePath("/cart");
  redirect(`/orders/${order.id}`);
}

/** Online card via HelaPay */
export async function placeOrderCard(formData: FormData): Promise<void> {
  const session = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
  const userId = (session.user as any).id;

  const shipping = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    line1: String(formData.get("line1") ?? ""),
    line2: String(formData.get("line2") ?? ""),
    city: String(formData.get("city") ?? ""),
    postal: String(formData.get("postal") ?? ""),
    country: "LK",
  };

  const cart = await getCart();
  if (cart.items.length === 0) redirect("/cart");

  const products = await db.product.findMany({
    where: { id: { in: cart.items.map(i => i.productId) }, active: true },
    select: { id: true, vendorId: true, title: true, priceCents: true, stock: true },
  });

  const items = cart.items.map(i => {
    const p = products.find(pp => pp.id === i.productId);
    if (!p) throw new Error("Some items are unavailable.");
    if (p.stock < i.qty) throw new Error(`Not enough stock for ${p.title}`);
    return { productId: p.id, qty: i.qty, priceCents: p.priceCents, vendorId: p.vendorId };
  });

  const totalCents = items.reduce((sum, it) => sum + it.priceCents * it.qty, 0);

  const order = await db.$transaction(async tx => {
    const ord = await tx.order.create({
      data: {
        buyerId: userId,
        status: "PENDING",
        totalCents,
        shippingAddr: shipping as any,
        paymentMethod: "HELAPAY", // <- intention
      },
    });

    await tx.orderItem.createMany({
      data: items.map(it => ({ orderId: ord.id, productId: it.productId, qty: it.qty, priceCents: it.priceCents })),
    });

    for (const it of items) {
      await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.qty } } });
    }

    await tx.payment.create({
      data: {
        orderId: ord.id,
        method: "HELAPAY",
        gateway: "HELAPAY",
        amountCents: totalCents,
        status: "INITIATED",
      },
    });

    const byVendor = new Map<string, number>();
    for (const it of items) byVendor.set(it.vendorId, (byVendor.get(it.vendorId) ?? 0) + it.priceCents * it.qty);
    for (const [vendorId, subtotalCents] of byVendor) {
      await tx.vendorOrder.create({ data: { vendorId, orderId: ord.id, status: "PENDING", subtotalCents } });
    }

    return ord;
  });

  // don’t clear cart until redirect; notify handler will mark PAID
  redirect(`/api/pay/helapay/init?orderId=${order.id}`);
}
