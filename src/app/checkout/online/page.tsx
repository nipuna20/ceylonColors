// src/app/checkout/online/page.tsx
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { getCart, clearCart } from "@/lib/cart";
import { redirect } from "next/navigation";

export default async function OnlineCheckout() {
  await requireRole(["BUYER", "VENDOR", "ADMIN"]);
  const cart = await getCart();
  if (!cart.items.length) {
    redirect("/cart");
  }
  return (
    <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Shipping details</h2>
        <form action={createOrderAndGoHelaPay} className="grid gap-3 max-w-xl">
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm text-gray-700">Name</span>
              <input name="name" required className="rounded-xl border px-3 py-2" />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-gray-700">Phone</span>
              <input name="phone" required className="rounded-xl border px-3 py-2" />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Address line 1</span>
            <input name="line1" required className="rounded-xl border px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Address line 2</span>
            <input name="line2" className="rounded-xl border px-3 py-2" />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="grid gap-1">
              <span className="text-sm text-gray-700">City</span>
              <input name="city" required className="rounded-xl border px-3 py-2" />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-gray-700">Postal code</span>
              <input name="postal" className="rounded-xl border px-3 py-2" />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-gray-700">Country</span>
              <input name="country" value="LK" readOnly className="rounded-xl border px-3 py-2 bg-gray-50" />
            </label>
          </div>

          <div className="mt-4 rounded-xl border p-4">
            <div className="font-medium">Payment method</div>
            <div className="text-sm text-gray-600">Online via Card (HelaPay)</div>
          </div>

          <button className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-white">Pay now</button>
        </form>
      </div>
      <Summary />
    </div>
  );
}

async function Summary() {
  const cart = await getCart();
  const products = cart.items.length
    ? await db.product.findMany({ where: { id: { in: cart.items.map(i => i.productId) } } })
    : [];
  const subtotal = cart.items.reduce((sum, i) => {
    const p = products.find(pp => pp.id === i.productId);
    return sum + (p ? p.priceCents/100 : 0) * i.qty;
  }, 0);

  return (
    <aside className="rounded-xl border bg-white p-6 h-fit">
      <h2 className="text-lg font-semibold mb-2">Order summary</h2>
      <div className="flex items-center justify-between">
        <span>Subtotal</span>
        <span>LKR {subtotal.toFixed(2)}</span>
      </div>
      <div className="text-sm text-gray-600 mt-3">
        You’ll pay securely via HelaPay.
      </div>
    </aside>
  );
}

// --- server action to create order then redirect to helapay init
export async function createOrderAndGoHelaPay(formData: FormData): Promise<void> {
  "use server";
  const session = await requireRole(["BUYER","VENDOR","ADMIN"]);
  const uid = (session.user as any).id;

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
  if (!cart.items.length) return;

  const products = await db.product.findMany({
    where: { id: { in: cart.items.map(i => i.productId) }, active: true },
    select: { id: true, vendorId: true, priceCents: true, stock: true, title: true },
  });

  const items = cart.items.map(i => {
    const p = products.find(pp => pp.id === i.productId);
    if (!p) throw new Error("Item unavailable");
    if (p.stock < i.qty) throw new Error(`Not enough stock for ${p.title}`);
    return { productId: p.id, qty: i.qty, priceCents: p.priceCents, vendorId: p.vendorId };
  });
  const totalCents = items.reduce((s, it) => s + it.priceCents * it.qty, 0);

  const order = await db.$transaction(async (tx) => {
    const ord = await tx.order.create({
      data: {
        buyerId: uid,
        status: "PENDING",          // becomes PAID on notify
        totalCents,
        shippingAddr: shipping as any,
        paymentMethod: "HELAPAY",   // set intention
      },
    });
    await tx.orderItem.createMany({
      data: items.map(it => ({ orderId: ord.id, productId: it.productId, qty: it.qty, priceCents: it.priceCents })),
    });
    for (const it of items) {
      await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.qty } } });
    }
    const byVendor = new Map<string, number>();
    for (const it of items) {
      byVendor.set(it.vendorId, (byVendor.get(it.vendorId) ?? 0) + it.priceCents * it.qty);
    }
    for (const [vendorId, subtotalCents] of byVendor) {
      await tx.vendorOrder.create({ data: { vendorId, orderId: ord.id, status: "PENDING", subtotalCents } });
    }
    return ord;
  });

  await clearCart();

// Redirect to our HelaPay init route
redirect(`/api/pay/helapay/init?orderId=${order.id}`);
}
