// src/app/(public)/products/page.tsx
import { db } from "@/lib/db";
import Link from "next/link";
import AddToCart from "@/components/AddToCart";
import BannerSlider from "@/components/BannerSlider"; // Adjust path if needed

export default async function ProductsPage() {
  const products = await db.product.findMany({
    where: { active: true },
    include: {
      images: true,
      vendor: { select: { shopName: true } },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const total = products.length;

  return (
    <main className="w-full min-h-screen bg-slate-950/5">
      {/* Hero / Banner section */}
      <section className="bg-gradient-to-br from-sky-600 via-indigo-600 to-purple-700 text-white">
        {/* Slider sits inside hero */}
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-6 md:pb-10 space-y-4 md:space-y-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-center">
            <div className="space-y-3 md:space-y-4">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Discover the best from local vendors
              </span>
              <h1 className="text-3xl md:text-4xl font-semibold leading-snug">
                Browse{" "}
                <span className="font-extrabold">
                  {total.toLocaleString()}
                </span>{" "}
                carefully curated products on{" "}
                <span className="font-extrabold">Malpra</span>.
              </h1>
              <p className="text-sm md:text-base text-slate-100/90 max-w-xl">
                Flowers, cakes, gifts, decor and more — all in one place. Add to
                cart in one click and get everything delivered with care.
              </p>
              {total > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-slate-50 border border-white/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Showing newest products first
                </div>
              )}
            </div>

            {/* Right side: banner slider */}
            <div className="w-full rounded-2xl overflow-hidden border border-white/20 shadow-lg shadow-black/20 bg-white/5 backdrop-blur">
              <BannerSlider />
            </div>
          </div>
        </div>
      </section>

      {/* Main product grid card */}
      <section className="-mt-4 md:-mt-6 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-3xl bg-white shadow-xl shadow-slate-900/5 border border-slate-100 px-4 py-6 md:px-6 md:py-8 space-y-6">
            {/* Header / summary */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                  All products
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Browse everything our vendors have listed. Click a card to see
                  full details, or add directly to your cart.
                </p>
              </div>
              <div className="flex flex-col items-end text-xs text-slate-600">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="font-medium text-slate-800">
                    {total.toLocaleString()}
                  </span>
                  <span>{total === 1 ? "product available" : "products available"}</span>
                </div>
                <span className="mt-1 text-[11px] text-slate-400">
                  Sorted by newest added
                </span>
              </div>
            </div>

            {/* Empty state */}
            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  No products available yet.
                </p>
                <p className="text-xs text-slate-500">
                  Please check back later — vendors are still adding items.
                </p>
              </div>
            ) : (
              // Product grid
              <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const price = (product.priceCents ?? 0) / 100;
                  const categoryName = product.category?.name;
                  const originalPriceCents =
                    (product as any).originalPriceCents ?? (product as any).compareAtPriceCents ?? null;
                  const originalPrice =
                    originalPriceCents != null
                      ? originalPriceCents / 100
                      : null;
                  const discountPercent = originalPrice
                    ? Math.round(((originalPrice - price) / originalPrice) * 100)
                    : null;

                  // Safely read optional rating/reviewCount from product (avoid TS error)
                  const rating = (product as any).rating ?? null;
                  const reviewCount = (product as any).reviewCount ?? null;

                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                    >
                      <Link href={`/products/${product.slug}`} tabIndex={-1}>
                        <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden group-hover:scale-105 transition-transform duration-200">
                          {/* Discount Badge */}
                          {discountPercent && discountPercent > 0 && (
                            <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-md transform transition-all duration-300 group-hover:scale-110">
                              {discountPercent}% Off
                            </div>
                          )}
                          {/* Category Badge */}
                          {categoryName && (
                            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm">
                              {categoryName}
                            </div>
                          )}
                          {/* Image */}
                          <img
                            src={product.images[0]?.url ?? "https://placehold.co/600x750?text=No+Image"}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </Link>

                      <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                        <div className="space-y-1.5">
                          <Link
                            href={`/products/${product.slug}`}
                            className="block text-sm md:text-[15px] font-semibold text-slate-900 leading-snug hover:text-sky-700 hover:underline line-clamp-2"
                          >
                            {product.title}
                          </Link>
                          <div className="text-xs text-slate-500">
                            by <span className="font-medium">{product.vendor.shopName}</span>
                          </div>
                        </div>

                        <div className="flex items-end justify-between gap-2 pt-1">
                          {/* Price and Discount */}
                          <div className="text-lg md:text-xl font-bold text-sky-600 tracking-tight">
                            Rs{" "}
                            {price.toLocaleString("en-LK", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                          {originalPrice && (
                            <div className="text-xs text-slate-400 line-through">
                              Rs{" "}
                              {originalPrice.toLocaleString("en-LK", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                          )}
                          {/* Ratings/Reviews */}
                          {rating != null && (
                            <div className="flex items-center gap-1 text-sm text-yellow-500">
                              {Array.from({ length: 5 }, (_, index) => (
                                <span
                                  key={index}
                                  className={`${
                                    index < Number(rating) ? "text-yellow-400" : "text-gray-300"
                                  } material-icons`}
                                >
                                  ★
                                </span>
                              ))}
                              <span className="text-xs text-slate-500">
                                ({reviewCount} Reviews)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Add to Cart Button */}
                       <div className="w-44 md:w-46">
                        <AddToCart productId={product.id} />
                      </div>


                      {/* Out of Stock */}
                      {product.stock === 0 && (
                        <div className="text-xs text-red-600 font-medium text-center py-2">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
