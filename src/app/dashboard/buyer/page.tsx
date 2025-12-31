import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

// Status badge with colors
function StatusBadge({ status }: { status: string }) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-100",
    PROCESSING: "bg-blue-50 text-blue-700 border border-blue-100",
    SHIPPED: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    CANCELLED: "bg-rose-50 text-rose-700 border border-rose-100",
  };

  const cls = map[status] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`${base} ${cls}`}>
      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default async function BuyerDashboard() {
  const session = await requireRole(["BUYER"]);
  const userId = (session.user as any).id;

  const orders = await db.order.findMany({
    where: { buyerId: userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });

  const totalOrders = orders.length;
  const totalSpent =
    orders.reduce((sum, o) => sum + o.totalCents, 0) / 100;

  const lastOrderDate =
    orders[0]?.createdAt instanceof Date ? orders[0].createdAt : null;

  if (!orders.length) {
    return (
      <div className="min-h-[60vh] space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M3 6h18l-2 9H5L3 6z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx={9} cy={18} r={1} />
                  <circle cx={17} cy={18} r={1} />
                </svg>
              </span>
              <span>My orders</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              All your past and current orders will appear here.
            </p>
          </div>
        </header>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 6h18l-2 9H5L3 6z"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={9} cy={18} r={1} />
              <circle cx={17} cy={18} r={1} />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            You don&apos;t have any orders yet
          </h2>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            When you purchase items, your order history and statuses will show
            up on this page.
          </p>
          <div className="mt-4">
            <Link
              href="/products"
              className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Browse products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] space-y-6">
      {/* Header + stats */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M3 6h18l-2 9H5L3 6z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={9} cy={18} r={1} />
                <circle cx={17} cy={18} r={1} />
              </svg>
            </span>
            <span>My orders</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your recent purchases and follow their status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-[11px] text-slate-500">Total orders</div>
            <div className="text-base font-semibold text-slate-900">
              {totalOrders}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-[11px] text-slate-500">Total spent</div>
            <div className="text-base font-semibold text-emerald-600">
              LKR {totalSpent.toFixed(2)}
            </div>
          </div>
          {lastOrderDate && (
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="text-[11px] text-slate-500">Last order</div>
              <div className="text-[12px] font-medium text-slate-900">
                {lastOrderDate.toLocaleDateString("en-LK", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Orders list */}
      <ul className="space-y-3">
        {orders.map((o) => {
          const createdAt =
            o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
          const dateLabel = createdAt.toLocaleString("en-LK", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const itemCount = o.items.reduce(
            (sum, i) => sum + i.qty,
            0
          );
          const totalLkr = o.totalCents / 100;

          return (
            <li
              key={o.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                {/* Left side: meta */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Order #{o.id.slice(0, 8)}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5 text-slate-400"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 7v5l3 2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx={12}
                          cy={12}
                          r={8}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                        />
                      </svg>
                      <span>{dateLabel}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span>
                        Items:{" "}
                        <span className="font-medium">{itemCount}</span>
                      </span>
                      <span className="hidden xs:inline text-slate-300">
                        •
                      </span>
                      <span>
                        Total:{" "}
                        <span className="font-semibold text-slate-900">
                          LKR {totalLkr.toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Items preview */}
                  {o.items.length > 0 && (
                    <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600 space-y-1">
                      {o.items.slice(0, 3).map((i) => (
                        <div
                          key={i.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="line-clamp-1">
                            {i.product?.title ?? "Item"}
                          </span>
                          <span className="whitespace-nowrap">
                            x{i.qty}
                          </span>
                        </div>
                      ))}
                      {o.items.length > 3 && (
                        <div className="text-[10px] text-slate-400">
                          + {o.items.length - 3} more item
                          {o.items.length - 3 > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side: view details button */}
                <div className="flex flex-col items-stretch md:items-end gap-2 md:min-w-[180px]">
                  <Link
                    href={`/orders/${o.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 shadow-sm"
                  >
                    View order details
                    <svg
                      className="ml-1.5 h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M9 5l7 7-7 7"
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
