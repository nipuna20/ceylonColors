// src/components/ProductsFilterBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Cat = { slug: string; name: string; count: number };
type Vend = { id: string; name: string; count: number };

export default function ProductsFilterBar({
  initial,
  categories,
  vendors,
}: {
  initial: {
    q?: string;
    category?: string;
    vendorId?: string;
    sort?: string; // newest | price_asc | price_desc
    inStock?: boolean;
    priceMin?: number;
    priceMax?: number;
  };
  categories: Cat[];
  vendors: Vend[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(initial.q ?? "");
  const [category, setCategory] = useState(initial.category ?? "");
  const [vendorId, setVendorId] = useState(initial.vendorId ?? "");
  const [sort, setSort] = useState(initial.sort ?? "newest");
  const [inStock, setInStock] = useState(Boolean(initial.inStock));
  const [priceMin, setPriceMin] = useState<number | "">(
    initial.priceMin ?? ""
  );
  const [priceMax, setPriceMax] = useState<number | "">(
    initial.priceMax ?? ""
  );

  // Keep query in sync if the URL changes elsewhere
  useEffect(() => {
    setQ(sp.get("q") ?? "");
  }, [sp]);

  function apply() {
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (vendorId) params.set("vendor", vendorId);
    if (sort) params.set("sort", sort);
    if (inStock) params.set("stock", "1");
    if (priceMin !== "" && !Number.isNaN(Number(priceMin)))
      params.set("pmin", String(priceMin));
    if (priceMax !== "" && !Number.isNaN(Number(priceMax)))
      params.set("pmax", String(priceMax));

    // reset page on filter change
    params.set("page", "1");

    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  }

  function resetAll() {
    startTransition(() => {
      router.push("/products");
    });
  }

  return (
    <div className="rounded-2xl border bg-white p-4 flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
      <div className="grid gap-2 md:flex md:items-center md:gap-3 flex-1">
        <input
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full md:max-w-xs rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>

        <select
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">All vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.count})
            </option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
          />
          In stock
        </label>

        <div className="flex items-center gap-2 text-sm">
          <span>Rs</span>
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={priceMin}
            onChange={(e) =>
              setPriceMin(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-24 rounded-xl border px-2 py-1"
          />
          <span>—</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={priceMax}
            onChange={(e) =>
              setPriceMax(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-24 rounded-xl border px-2 py-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </select>
        <button
          onClick={apply}
          disabled={isPending}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Apply
        </button>
        <button
          onClick={resetAll}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
