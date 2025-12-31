import Link from "next/link";
import { db } from "@/lib/db";
import { getCart } from "@/lib/cart";
import { removeFromCart, updateQty, clearCartAction } from "./actions";

type Row = {
  productId: string;
  qty: number;
  title: string;
  price: number; // LKR
  img?: string;
  stock: number;
  active: boolean;
};

const DELIVERY_FEE = 400; // fixed Rs 400

export default async function CartPage() {
  const cart = await getCart();

  const products = cart.items.length
    ? await db.product.findMany({
        where: { id: { in: cart.items.map((i) => i.productId) } },
        include: { images: { take: 1 } },
      })
    : [];

  const rows: Row[] = cart.items.map((i) => {
    const p = products.find((pp) => pp.id === i.productId);
    const price = p ? p.priceCents / 100 : 0;
    const title = p ? p.title : "Unknown product";
    const img = p?.images[0]?.url;
    return {
      productId: i.productId,
      qty: i.qty,
      title,
      price,
      img,
      stock: p?.stock ?? 0,
      active: p?.active ?? false,
    };
  });

  const subtotal = rows.reduce((sum, r) => sum + r.price * r.qty, 0);
  const itemCount = rows.reduce((sum, r) => sum + r.qty, 0);

  const delivery = rows.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + delivery;

  return (
    <main className="min-h-[70vh] bg-slate-50 py-6">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                {/* cart icon */}
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M7 4h-2l-1 4m0 0l2 9h11l2-9H4z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx={10} cy={19} r={1} />
                  <circle cx={17} cy={19} r={1} />
                </svg>
              </span>
              <span>Your cart</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {itemCount === 0
                ? "You haven’t added anything yet."
                : `${itemCount} item${itemCount > 1 ? "s" : ""} in your cart`}
            </p>
          </div>

          {rows.length > 0 && (
            <form action={clearCartAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V5h6v2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Clear cart</span>
              </button>
            </form>
          )}
        </div>

        {rows.length === 0 ? (
          // Empty state
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M7 4h-2l-1 4m0 0l2 9h11l2-9H4z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={10} cy={19} r={1} />
                <circle cx={17} cy={19} r={1} />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Your cart is empty
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Discover fresh flowers, cakes, and gifts for every occasion.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <span>Browse products</span>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14m0 0l-5-5m5 5l-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        ) : (
          // Cart layout
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            {/* Items list */}
            <section className="space-y-3">
              {rows.map((r) => (
                <article
                  key={r.productId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    {r.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.img}
                        alt={r.title}
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-slate-200 bg-slate-50"
                      />
                    ) : (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <h2 className="font-medium text-sm sm:text-base text-slate-900">
                          {r.title}
                        </h2>
                        {!r.active && (
                          <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-slate-500">
                        LKR {r.price.toFixed(2)}
                      </div>

                      {r.stock < r.qty && (
                        <div className="text-xs text-orange-600 mt-0.5">
                          Only {r.stock} left in stock
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 min-w-[180px]">
                    {/* Qty controls */}
                    <form
                      action={updateQty}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="hidden"
                        name="productId"
                        value={r.productId}
                      />
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 overflow-hidden">
                        <button
                          type="submit"
                          name="qty"
                          value={Math.max(r.qty - 1, 0)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                        >
                          −
                        </button>
                        <span className="px-2 min-w-[2.5rem] text-center text-slate-800">
                          {r.qty}
                        </span>
                        <button
                          type="submit"
                          name="qty"
                          value={r.qty + 1}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </form>

                    {/* Remove */}
                    <form action={removeFromCart}>
                      <input
                        type="hidden"
                        name="productId"
                        value={r.productId}
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M6 6h12M10 10v6M14 10v6M9 6l1-2h4l1 2M7 6l1 12h8l1-12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.6}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>Remove</span>
                      </button>
                    </form>

                    {/* line total */}
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      LKR {(r.price * r.qty).toFixed(2)}
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {/* Summary */}
            <aside className="space-y-4">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Order summary
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>LKR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Delivery</span>
                    <span>
                      {delivery > 0
                        ? `LKR ${delivery.toFixed(2)}`
                        : "LKR 0.00"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t pt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    Total
                  </span>
                  <span className="text-lg font-semibold text-blue-600">
                    LKR {total.toFixed(2)}
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-slate-500">
                  Flat delivery fee of LKR {DELIVERY_FEE.toFixed(2)} applies to
                  all orders.
                </p>

                <Link
                  href="/checkout"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <span>Proceed to checkout</span>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h14m0 0l-5-5m5 5l-5 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>

                <p className="mt-2 text-[11px] text-slate-500 text-center">
                  Secure checkout • Multiple payment methods • SSL encrypted
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-[11px] text-slate-600">
                <p className="font-semibold mb-1 text-slate-700">
                  Need to add more items?
                </p>
                <p>
                  You can come back to this cart any time. Your items will be
                  saved on this device.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
