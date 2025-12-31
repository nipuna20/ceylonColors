// Server-only cookie cart helpers
import { cookies } from "next/headers";

type CartItem = {
  productId: string;
  variantId?: string | null;
  qty: number;
};

export type Cart = { items: CartItem[] };

const COOKIE = "malpra_cart";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function safeParse<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export async function getCart(): Promise<Cart> {
  const store = await cookies();
  const c = store.get(COOKIE)?.value;
  return safeParse<Cart>(c, { items: [] });
}

export async function setCart(cart: Cart): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
