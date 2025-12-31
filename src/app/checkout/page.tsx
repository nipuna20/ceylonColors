import Link from "next/link";
import { getCart } from "@/lib/cart";
import { db } from "@/lib/db";
import { placeOrder, placeOrderCard } from "./actions";
import { requireRole } from "@/lib/rbac";

const DELIVERY_FEE = 400; // Rs 400 flat delivery

export default async function CheckoutPage() {
  await requireRole(["BUYER", "VENDOR", "ADMIN"]);

  const cart = await getCart();

  const products = cart.items.length
    ? await db.product.findMany({
        where: { id: { in: cart.items.map((i) => i.productId) } },
      })
    : [];

  const subtotal = cart.items.reduce((sum, i) => {
    const p = products.find((pp) => pp.id === i.productId);
    return sum + (p ? p.priceCents / 100 : 0) * i.qty;
  }, 0);

  const itemCount = cart.items.reduce((sum, i) => sum + i.qty, 0);
  const delivery = cart.items.length ? DELIVERY_FEE : 0;
  const total = subtotal + delivery;

  if (!cart.items.length) {
    return (
      <main className="min-h-[70vh] bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
              <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden="true">
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
            <h1 className="text-xl font-semibold text-slate-900">
              Your cart is empty
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Add some items before proceeding to checkout.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <span>Browse products</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
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
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Header / step indicator */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                {/* checkout icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6 7h12l-1.2 8.4A2 2 0 0 1 14.82 17H9.18a2 2 0 0 1-1.98-1.6L6 7z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 7a3 3 0 0 1 6 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span>Checkout</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Complete your delivery details and choose a payment method.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex h-7 items-center rounded-full bg-slate-100 px-3 font-medium">
              Step 2 of 2
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Left column – shipping + payment */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
            {/* Shipping */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 text-xs">
                    1
                  </span>
                  Shipping details
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  We’ll use this information to deliver your order.
                </p>
              </div>
            </div>

            <form action={placeOrder} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs">
                  <span className="font-medium text-slate-700">Name</span>
                  <input
                    name="name"
                    required
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Full name"
                  />
                </label>
                <label className="grid gap-1 text-xs">
                  <span className="font-medium text-slate-700">Phone</span>
                  <input
                    name="phone"
                    required
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="07X XXX XXXX"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">
                  Address line 1
                </span>
                <input
                  name="line1"
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="House number, street"
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">
                  Address line 2 (optional)
                </span>
                <input
                  name="line2"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Apartment, floor, etc."
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="grid gap-1 text-xs">
                  <span className="font-medium text-slate-700">City</span>
                  <input
                    name="city"
                    required
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Colombo"
                  />
                </label>
                <label className="grid gap-1 text-xs">
                  <span className="font-medium text-slate-700">
                    Postal code
                  </span>
                  <input
                    name="postal"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g. 00700"
                  />
                </label>
                <label className="grid gap-1 text-xs">
                  <span className="font-medium text-slate-700">Country</span>
                  <input
                    name="country"
                    value="LK"
                    readOnly
                    className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
              </div>

              {/* Payment methods */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 text-xs">
                      2
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        Payment method
                      </div>
                      <p className="text-xs text-slate-500">
                        Choose how you’d like to pay for this order.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* COD */}
                  <button
                    type="submit"
                    formAction={placeOrder}
                    className="flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs hover:border-blue-500 hover:shadow-sm transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        {/* cash icon */}
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <rect
                            x="3"
                            y="6"
                            width="18"
                            height="12"
                            rx="2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.7}
                          />
                          <circle cx="12" cy="12" r="2.2" />
                        </svg>
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-slate-900">
                          Cash on Delivery
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Pay in cash when your order arrives.
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Card / PayHere */}
                  <button
                    type="submit"
                    formAction={placeOrderCard}
                    className="flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs hover:border-blue-500 hover:shadow-sm transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        {/* card icon */}
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <rect
                            x="3"
                            y="5"
                            width="18"
                            height="14"
                            rx="2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.7}
                          />
                          <rect x="4" y="9" width="16" height="2" />
                          <rect x="6" y="13" width="4" height="2" />
                        </svg>
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-slate-900">
                          Pay with card
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Secure online payment via PayHere.
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                      <span className="rounded-full border border-slate-200 px-2 py-0.5">
                        Visa
                      </span>
                      <span className="rounded-full border border-slate-200 px-2 py-0.5">
                        MasterCard
                      </span>
                      <span className="rounded-full border border-slate-200 px-2 py-0.5">
                        Amex
                      </span>
                    </div>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 mt-1">
                  Your payment details are encrypted. We never store full card
                  information.
                </p>
              </div>
            </form>
          </section>

          {/* Right column – summary */}
          <aside className="space-y-4">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs">
                  ₨
                </span>
                Order summary
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Items ({itemCount})</span>
                  <span>LKR {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Delivery</span>
                  <span>LKR {delivery.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 border-t pt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">Total</span>
                <span className="text-lg font-semibold text-blue-600">
                  LKR {total.toFixed(2)}
                </span>
              </div>

              <p className="mt-1 text-[11px] text-slate-500">
                Flat delivery fee of LKR {DELIVERY_FEE.toFixed(2)} applies to
                this order.
              </p>

              {/* Small list of items */}
              <div className="mt-4 rounded-xl bg-slate-50/70 p-3 max-h-44 overflow-y-auto text-xs space-y-2">
                {cart.items.map((i) => {
                  const p = products.find((pp) => pp.id === i.productId);
                  if (!p) return null;
                  const price = p.priceCents / 100;
                  return (
                    <div
                      key={i.productId}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Qty {i.qty} • LKR {price.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-800">
                        LKR {(price * i.qty).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-2 text-[11px] text-slate-500 text-center">
                Secure checkout • SSL encrypted • Local payment methods
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] text-slate-600">
              <p className="font-semibold mb-1 text-slate-700">
                Need to edit your cart?
              </p>
              <p>
                You can go back to your cart to update quantities or remove
                items before placing the order.
              </p>
              <Link
                href="/cart"
                className="mt-2 inline-block text-blue-600 hover:underline"
              >
                Return to cart
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
