"use client";
import { addToCart } from "@/app/cart/actions";

export default function AddToCart({ productId }: { productId: string }) {
  return (
    <form action={addToCart} className="flex items-center gap-2">
      <input type="hidden" name="productId" value={productId} />
      <input name="qty" type="number" min={1} defaultValue={1} className="w-20 rounded-lg border px-2 py-1 text-sm" />
      <button className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
        Add to cart
      </button>
    </form>
  );
}
