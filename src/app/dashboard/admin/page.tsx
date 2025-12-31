import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

type Search = { start?: string; end?: string };

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - 30);
  return { start: isoDate(start), end: isoDate(end) };
}
function rangeToDates(startStr: string, endStr: string) {
  const start = new Date(`${startStr}T00:00:00.000Z`);
  const end = new Date(`${endStr}T00:00:00.000Z`);
  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, end, endExclusive };
}

export default async function AdminHome({ searchParams }: { searchParams?: Search }) {
  await requireRole(["ADMIN"]);

  // ---- 1) Date range
  const { start: defStart, end: defEnd } = defaultRange();
  const startStr = searchParams?.start || defStart;
  const endStr = searchParams?.end || defEnd;
  const { start, end, endExclusive } = rangeToDates(startStr, endStr);

  // ---- 2) Base counts (global)
  const [users, vendorsApproved, productsActive] = await Promise.all([
    db.user.count(),
    db.vendor.count({ where: { isApproved: true } }),
    db.product.count({ where: { active: true } }),
  ]);

  // ---- 3) Period data (orders in period)
  // We’ll treat GMV as sum of orders with these statuses in the period:
  const payableStatuses = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] as const;

  const [ordersInPeriod, completedInPeriod, gmvAgg] = await Promise.all([
    db.order.count({
      where: { createdAt: { gte: start, lt: endExclusive } },
    }),
    db.order.count({
      where: { createdAt: { gte: start, lt: endExclusive }, status: "COMPLETED" },
    }),
    db.order.aggregate({
      where: {
        createdAt: { gte: start, lt: endExclusive },
        status: { in: payableStatuses as unknown as any },
      },
      _sum: { totalCents: true },
    }),
  ]);

  const gmv = (gmvAgg._sum.totalCents ?? 0) / 100;
  const aov = ordersInPeriod ? gmv / ordersInPeriod : 0;

  // ---- 4) Recent orders (last 10 in period)
  const recentOrders = await db.order.findMany({
    where: { createdAt: { gte: start, lt: endExclusive } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { buyer: { select: { email: true } } },
  });

  // ---- 5) Top vendors (by VendorOrder subtotal in period)
  const vendorOrders = await db.vendorOrder.findMany({
    where: {
      order: { is: { createdAt: { gte: start, lt: endExclusive } } },
      status: { in: ["PROCESSING", "SHIPPED", "COMPLETED"] }, // earning-related
    },
    include: { vendor: { select: { id: true, shopName: true } } },
  });
  const byVendor = new Map<string, { shopName: string; cents: number }>();
  for (const vo of vendorOrders) {
    const prev = byVendor.get(vo.vendor.id) ?? { shopName: vo.vendor.shopName, cents: 0 };
    prev.cents += vo.subtotalCents;
    byVendor.set(vo.vendor.id, prev);
  }
  const topVendors = Array.from(byVendor.values())
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 5);

  // ---- 6) Top products (by quantity in period)
  const items = await db.orderItem.findMany({
    where: { order: { is: { createdAt: { gte: start, lt: endExclusive } } } },
    include: { product: { select: { title: true } } },
  });
  const byProduct = new Map<string, { title: string; qty: number; cents: number }>();
  for (const it of items) {
    const key = it.productId;
    const prev = byProduct.get(key) ?? { title: it.product.title, qty: 0, cents: 0 };
    prev.qty += it.qty;
    prev.cents += it.priceCents * it.qty;
    byProduct.set(key, prev);
  }
  const topProducts = Array.from(byProduct.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // ---- 7) GMV by day sparkline (inline SVG, no deps)
  // build day buckets
  const dayMs = 24 * 60 * 60 * 1000;
  const days: string[] = [];
  const dailyTotals: number[] = [];
  const series = await db.order.findMany({
    where: {
      createdAt: { gte: start, lt: endExclusive },
      status: { in: payableStatuses as unknown as any },
    },
    select: { createdAt: true, totalCents: true },
    orderBy: { createdAt: "asc" },
  });
  const bucket = new Map<string, number>();
  for (const o of series) {
    const key = isoDate(o.createdAt);
    bucket.set(key, (bucket.get(key) ?? 0) + (o.totalCents ?? 0));
  }
  for (let t = start.getTime(); t < endExclusive.getTime(); t += dayMs) {
    const label = isoDate(new Date(t));
    days.push(label);
    dailyTotals.push((bucket.get(label) ?? 0) / 100);
  }
  const svg = sparkline(dailyTotals, 280, 56);

  const kpis = [
    { label: "GMV (LKR)", value: gmv.toFixed(2) },
    { label: "Orders", value: ordersInPeriod },
    { label: "Completed", value: completedInPeriod },
    { label: "AOV (LKR)", value: aov.toFixed(2) },
    { label: "Active vendors", value: vendorsApproved },
    { label: "Active products", value: productsActive },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>

      {/* Date filter */}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Start</span>
          <input type="date" name="start" defaultValue={startStr} className="rounded-xl border px-3 py-2" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">End</span>
          <input type="date" name="end" defaultValue={endStr} className="rounded-xl border px-3 py-2" />
        </label>
        <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Apply</button>
      </form>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((i) => (
          <div key={i.label} className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">{i.label}</div>
            <div className="mt-2 text-2xl font-semibold">{i.value as any}</div>
          </div>
        ))}
      </div>

      {/* GMV trend */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-medium">GMV by day</div>
          <div className="text-sm text-gray-600">
            {startStr} → {endStr}
          </div>
        </div>
        <div className="text-xs text-gray-500 mb-2">Simple sparkline of GMV (LKR) per day</div>
        <div
          className="w-full overflow-hidden"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* Two columns: Top vendors / Top products */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <div className="mb-3 font-medium">Top vendors (by revenue)</div>
          {topVendors.length === 0 ? (
            <div className="text-sm text-gray-600">No vendor revenue in this period.</div>
          ) : (
            <ul className="grid gap-2">
              {topVendors.map((v) => (
                <li key={v.shopName} className="flex items-center justify-between rounded-xl border p-3">
                  <span className="text-sm">{v.shopName}</span>
                  <span className="text-sm font-semibold">LKR {(v.cents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="mb-3 font-medium">Top products (by quantity)</div>
          {topProducts.length === 0 ? (
            <div className="text-sm text-gray-600">No product sales in this period.</div>
          ) : (
            <ul className="grid gap-2">
              {topProducts.map((p) => (
                <li key={p.title} className="flex items-center justify-between rounded-xl border p-3">
                  <span className="text-sm">{p.title}</span>
                  <span className="text-sm font-semibold">{p.qty} pcs • LKR {(p.cents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="mb-3 font-medium">Recent orders</div>
        {recentOrders.length === 0 ? (
          <div className="text-sm text-gray-600">No orders in this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Buyer</th>
                  <th className="py-2 pr-4">Total (LKR)</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2 pr-4 font-medium">#{o.id.slice(0, 8)}</td>
                    <td className="py-2 pr-4">{o.buyer?.email ?? "—"}</td>
                    <td className="py-2 pr-4">{((o.totalCents ?? 0) / 100).toFixed(2)}</td>
                    <td className="py-2 pr-4">{o.status}</td>
                    <td className="py-2 pr-4">{isoDate(o.createdAt)}</td>
                    <td className="py-2 pr-4">
                    <Link
                      href={`/dashboard/admin/orders/${o.id}`}
                      className="rounded-xl border px-3 py-1 hover:bg-gray-50"
                    >
                      View
                    </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tiny inline sparkline: returns an SVG string for the given values.
 * Keeps things dependency-free. Width/height are in px.
 */
function sparkline(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f9fafb"/>
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" fill="#9ca3af" font-size="10">No data</text>
    </svg>`;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const n = values.length;
  const step = n > 1 ? w / (n - 1) : 0;

  const norm = (v: number) => (max === min ? 0.5 : (v - min) / (max - min));
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - norm(v)) * h;
    return `${x},${y}`;
  });

  // area fill baseline
  const baseline = `${pad + (n - 1) * step},${height - pad} ${pad},${height - pad}`;
  const polygon = `${pts.join(" ")} ${baseline}`;

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" rx="8" fill="#ffffff" />
  <polyline points="${pts.join(" ")}" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" />
  <polygon points="${polygon}" fill="#6366f11a" />
</svg>`;
}
