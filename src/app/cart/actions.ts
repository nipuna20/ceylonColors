"use server";

import { revalidatePath } from "next/cache";
import { getCart, setCart, clearCart } from "@/lib/cart";
// TOP: import db
import { db } from "@/lib/db";


export async function addToCart(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId"));
  const qty = Math.max(1, Number(formData.get("qty") ?? 1));

  // NEW: validate product
  const p = await db.product.findUnique({
    where: { id: productId },
    select: { active: true, stock: true },
  });
  if (!p || !p.active) return;

  const cart = await getCart();
  const existing = cart.items.find(i => i.productId === productId);
  if (existing) {
    existing.qty = Math.min(p.stock, existing.qty + qty); // cap by stock
  } else {
    cart.items.push({ productId, qty: Math.min(p.stock, qty) });
  }

  await setCart(cart);
  revalidatePath("/cart");
}

export async function updateQty(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId"));
  const qty = Math.max(0, Number(formData.get("qty") ?? 1));
  const cart = await getCart();

  const item = cart.items.find(i => i.productId === productId);
  if (!item) return;

  if (qty === 0) {
    cart.items = cart.items.filter(i => i.productId !== productId);
  } else {
    // NEW: cap by stock if product still exists
    const p = await db.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    item.qty = Math.min(p?.stock ?? qty, qty);
  }

  await setCart(cart);
  revalidatePath("/cart");
}


export async function removeFromCart(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId"));
  const cart = await getCart();
  cart.items = cart.items.filter(i => i.productId !== productId);
  await setCart(cart);
  revalidatePath("/cart");
}

export async function clearCartAction(): Promise<void> {
  await clearCart();
  revalidatePath("/cart");
}
