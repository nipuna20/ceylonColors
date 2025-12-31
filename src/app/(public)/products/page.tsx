// src/app/(public)/products/page.tsx
import { db } from "@/lib/db";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductsFilterBar from "@/components/ProductsFilterBar";

type SP = { [k: string]: string | string[] | undefined };
const getOne = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v ?? "";

const PAGE_SIZE = 12;

export default async function ProductsPage({ searchParams }: { searchParams?: SP }) {
  const sp = searchParams ?? {};

  // read filters/sort/pagination from URL
  const q = getOne(sp.q);
  const category = getOne(sp.category);
  const vendorId = getOne(sp.vendor);
  const sort = getOne(sp.sort) || "newest"; // newest | price_asc | price_desc
  const inStock = getOne(sp.stock) === "1";
  const priceMin = Number(getOne(sp.pmin)) || undefined;
  const priceMax = Number(getOne(sp.pmax)) || undefined;
  const page = Math.max(1, Number(getOne(sp.page)) || 1);

  // build prisma where
  const where: any = { active: true };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) {
    where.category = { slug: category };
  }
  if (vendorId) where.vendorId = vendorId;
  if (inStock) where.stock = { gt: 0 };
  if (priceMin || priceMax) {
    where.priceCents = {};
    if (priceMin) where.priceCents.gte = Math.round(priceMin * 100);
    if (priceMax) where.priceCents.lte = Math.round(priceMax * 100);
  }

  const orderBy =
    sort === "price_asc"
      ? { priceCents: "asc" as const }
      : sort === "price_desc"
      ? { priceCents: "desc" as const }
      : { createdAt: "desc" as const };

  const [total, products, facets] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        images: { take: 1 },
        vendor: { select: { id: true, shopName: true } },
        reviews: { select: { rating: true } },
      },
    }),
    (async () => {
      const [cats, catCounts, venCounts, priceBounds] = await Promise.all([
        db.category.findMany({ select: { id: true, name: true, slug: true } }),
        db.product.groupBy({
          by: ["categoryId"],
          _count: { _all: true },
          where: { active: true },
        }),
        db.product.groupBy({
          by: ["vendorId"],
          _count: { _all: true },
          where: { active: true },
        }),
        db.product.aggregate({
          _min: { priceCents: true },
          _max: { priceCents: true },
          where: { active: true },
        }),
      ]);

      const catWithCounts = cats
        .map((c) => ({
          slug: c.slug,
          name: c.name,
          count:
            catCounts.find((x) => x.categoryId === c.id)?._count._all ?? 0,
        }))
        .filter((x) => x.count > 0)
        .sort((a, b) => a.name.localeCompare(b.name));

      const vendorIds = venCounts.map((v) => v.vendorId);
      const vendors = vendorIds.length
        ? await db.vendor.findMany({
            where: { id: { in: vendorIds } },
            select: { id: true, shopName: true },
          })
        : [];

      const vendorsWithCounts = vendors
        .map((v) => ({
          id: v.id,
          name: v.shopName,
          count: venCounts.find((x) => x.vendorId === v.id)!._count._all,
        }))
        .sort((a, b) => b.count - a.count);

      const min = (priceBounds._min.priceCents ?? 0) / 100;
      const max = (priceBounds._max.priceCents ?? 0) / 100;

      return { categories: catWithCounts, vendors: vendorsWithCounts, min, max };
    })(),
  ]);

  // massage ratings (avg) for display
  const items = products.map((p) => {
    const reviewCount = p.reviews.length;
    const avg =
      reviewCount === 0
        ? 0
        : Math.round(
            (p.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10
          ) / 10;

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      priceCents: p.priceCents,
      image: p.images[0]?.url ?? null,
      vendorName: p.vendor.shopName,
      rating: avg,
      reviewCount,
      inStock: p.stock > 0,
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // for fancy pagination (page window)
  const pageWindowStart = Math.max(1, page - 2);
  const pageWindowEnd = Math.min(totalPages, page + 2);
  const pageNumbers = [];
  for (let p = pageWindowStart; p <= pageWindowEnd; p++) {
    pageNumbers.push(p);
  }

  return (
    <div className="min-h-screen bg-slate-950/5">
      {/* HERO */}
      <section className="bg-gradient-to-br from-sky-600 via-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-8 md:py-10 space-y-4 md:space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 md:space-y-3 max-w-xl">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                Discover · Send · Celebrate
              </span>
              <h1 className="text-3xl md:text-4xl font-semibold leading-snug">
                Find the perfect gift from{" "}
                <span className="font-extrabold">
                  {total.toLocaleString()}+
                </span>{" "}
                curated products.
              </h1>
              <p className="text-sm md:text-base text-slate-100/90">
                Fresh flowers, designer cakes, perfumes and more from trusted
                Malpra vendors. Filter by category, price, rating and stock to
                match exactly what you need.
              </p>
            </div>

            <div className="w-full max-w-xs md:max-w-sm">
              <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-xs space-y-2 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-slate-100">Products</span>
                  <span className="font-semibold">
                    {total.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-100">Price range</span>
                  <span className="font-semibold">
                    LKR {facets.min.toLocaleString()} –{" "}
                    {facets.max.toLocaleString()}
                  </span>
                </div>
                {inStock && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-100">Stock filter</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      In stock only
                    </span>
                  </div>
                )}
                {q && (
                  <div className="pt-1 text-[11px] text-slate-100/80 truncate">
                    Current search: <span className="font-semibold">“{q}”</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CATEGORY CHIPS */}
          {facets.categories.length > 0 && (
            <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] uppercase tracking-wide text-slate-100/70">
                Popular categories
              </span>
              {facets.categories.slice(0, 10).map((c) => (
                <Link
                  key={c.slug}
                  href={`/products?category=${encodeURIComponent(c.slug)}`}
                  className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    c.slug === category
                      ? "border-white bg-white text-sky-700"
                      : "border-white/30 bg-white/5 text-slate-100 hover:bg-white/15"
                  }`}
                >
                  {c.name}{" "}
                  <span className="text-[10px] opacity-80">
                    ({c.count.toLocaleString()})
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MAIN CONTENT CARD */}
      <main className="-mt-6 md:-mt-8 pb-10">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-white shadow-xl shadow-slate-900/5 border border-slate-100 px-3 py-4 md:px-6 md:py-6 space-y-5 md:space-y-7">
            {/* Filter bar */}
            <section className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-3 md:px-4 md:py-4">
              <ProductsFilterBar
                initial={{
                  q,
                  category,
                  vendorId,
                  sort,
                  inStock,
                  priceMin: priceMin ?? facets.min,
                  priceMax: priceMax ?? facets.max,
                }}
                categories={facets.categories}
                vendors={facets.vendors}
              />
            </section>

            {/* results summary */}
            <section className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-slate-600">
              <div>
                <span className="font-medium text-slate-800">
                  {total.toLocaleString()}{" "}
                  {total === 1 ? "result" : "results"}
                </span>
                {q && (
                  <>
                    {" "}
                    for <span className="italic">“{q}”</span>
                  </>
                )}
                {category && (
                  <>
                    {" "}
                    · Category:{" "}
                    <span className="font-medium">
                      {facets.categories.find((c) => c.slug === category)?.name ??
                        category}
                    </span>
                  </>
                )}
                {vendorId && (
                  <>
                    {" "}
                    · Vendor:{" "}
                    <span className="font-medium">
                      {facets.vendors.find((v) => v.id === vendorId)?.name ??
                        "Selected vendor"}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {inStock && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    In-stock filter
                  </span>
                )}
                {sort === "price_asc" && (
                  <Chip label="Sorted by lowest price" />
                )}
                {sort === "price_desc" && (
                  <Chip label="Sorted by highest price" />
                )}
                {sort === "newest" && <Chip label="Sorted by newest" />}
              </div>
            </section>

            {/* GRID / EMPTY */}
            <section>
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    No products match your filters.
                  </p>
                  <p className="text-xs text-slate-500">
                    Try removing some filters or searching with a different
                    keyword.
                  </p>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Reset filters
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </section>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <section className="flex flex-col items-center gap-3 pt-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  Page{" "}
                  <span className="font-semibold text-slate-900">{page}</span>{" "}
                  of {totalPages}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <PageBtn page={page - 1} disabled={page <= 1} sp={sp}>
                    Prev
                  </PageBtn>
                  {pageWindowStart > 1 && (
                    <>
                      <PageNumberBtn page={1} sp={sp} isCurrent={page === 1} />
                      {pageWindowStart > 2 && (
                        <span className="px-1 text-xs text-slate-400">…</span>
                      )}
                    </>
                  )}
                  {pageNumbers.map((p) => (
                    <PageNumberBtn
                      key={p}
                      page={p}
                      sp={sp}
                      isCurrent={p === page}
                    />
                  ))}
                  {pageWindowEnd < totalPages && (
                    <>
                      {pageWindowEnd < totalPages - 1 && (
                        <span className="px-1 text-xs text-slate-400">…</span>
                      )}
                      <PageNumberBtn
                        page={totalPages}
                        sp={sp}
                        isCurrent={page === totalPages}
                      />
                    </>
                  )}
                  <PageBtn page={page + 1} disabled={page >= totalPages} sp={sp}>
                    Next
                  </PageBtn>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      {label}
    </span>
  );
}

function PageBtn({
  page,
  disabled,
  sp,
  children,
}: {
  page: number;
  disabled?: boolean;
  sp: SP;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();
  // keep existing filters
  for (const [k, v] of Object.entries(sp)) {
    if (!v) continue;
    params.set(k, Array.isArray(v) ? v[0] : v);
  }
  params.set("page", String(page));

  return (
    <Link
      aria-disabled={disabled}
      href={`/products?${params.toString()}`}
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs md:text-sm transition ${
        disabled
          ? "pointer-events-none opacity-40 border-slate-200 text-slate-400"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </Link>
  );
}

function PageNumberBtn({
  page,
  sp,
  isCurrent,
}: {
  page: number;
  sp: SP;
  isCurrent?: boolean;
}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (!v) continue;
    params.set(k, Array.isArray(v) ? v[0] : v);
  }
  params.set("page", String(page));

  return (
    <Link
      href={`/products?${params.toString()}`}
      aria-current={isCurrent ? "page" : undefined}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition ${
        isCurrent
          ? "bg-sky-600 text-white shadow-sm"
          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {page}
    </Link>
  );
}
