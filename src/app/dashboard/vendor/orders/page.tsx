import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { updateVendorOrderStatus } from "./actions";

// Small helper for status badge colors
function StatusBadge({ status }: { status: string }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

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

export default async function VendorOrdersPage() {
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;

  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });

  if (!vendor) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
          Vendor profile not found. Please complete your vendor setup first.
        </div>
      </div>
    );
  }

  const vos = await db.vendorOrder.findMany({
    where: { vendorId: vendor.id },
    orderBy: { id: "desc" },
    include: {
      order: {
        include: {
          items: { include: { product: { select: { title: true } } } },
          buyer: { select: { email: true } },
        },
      },
    },
  });

  const totalOrders = vos.length;
  const totalRevenueLkr =
    vos.reduce((sum, vo) => sum + vo.subtotalCents, 0) / 100;

  if (!vos.length) {
    return (
      <div className="min-h-[60vh] space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My orders
            </h1>
            <p className="text-sm text-slate-500">
              You don&apos;t have any orders yet. New orders will appear here as customers check out.
            </p>
          </div>
        </header>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden="true">
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
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            No orders yet
          </h2>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            As soon as customers place orders for your products, you&apos;ll see them here and can update the status (Processing, Shipped, Completed, etc.).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] space-y-6">
      {/* Page header + quick stats */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600">
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
            Manage all orders that include your products. Update statuses as you process them.
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
            <div className="text-[11px] text-slate-500">Total revenue</div>
            <div className="text-base font-semibold text-emerald-600">
              LKR {totalRevenueLkr.toFixed(2)}
            </div>
          </div>
        </div>
      </header>

      {/* Orders list */}
      <ul className="space-y-3">
        {vos.map((vo) => {
          const createdAt =
            (vo.order as any).createdAt instanceof Date
              ? (vo.order as any).createdAt
              : undefined;
          const dateLabel = createdAt
            ? createdAt.toLocaleString("en-LK", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;

          const itemsCount = vo.order.items.reduce(
            (sum, item) => sum + (item.qty ?? 0),
            0
          );

          const subtotalLkr = vo.subtotalCents / 100;

          return (
            <li
              key={vo.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                {/* Left: order info */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Order #{vo.orderId.slice(0, 8)}
                    </span>
                    <StatusBadge status={vo.status} />
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>
                      Buyer:{" "}
                      <span className="font-medium text-slate-800">
                        {vo.order.buyer.email}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span>
                        Items:{" "}
                        <span className="font-medium">{itemsCount}</span>
                      </span>
                      <span className="hidden xs:inline text-slate-300">
                        •
                      </span>
                      <span>
                        Subtotal:{" "}
                        <span className="font-semibold text-slate-900">
                          LKR {subtotalLkr.toFixed(2)}
                        </span>
                      </span>
                    </div>
                    {dateLabel && (
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
                    )}
                  </div>

                  {/* Optional: preview of first few items */}
                  {vo.order.items.length > 0 && (
                    <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600 space-y-1">
                      {vo.order.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="line-clamp-1">
                            {item.product?.title ?? "Item"}
                          </span>
                          <span className="whitespace-nowrap">
                            x{item.qty}
                          </span>
                        </div>
                      ))}
                      {vo.order.items.length > 3 && (
                        <div className="text-[10px] text-slate-400">
                          + {vo.order.items.length - 3} more item
                          {vo.order.items.length - 3 > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: status update form */}
                <form
                  action={updateVendorOrderStatus}
                  className="flex flex-col items-stretch gap-2 md:items-end md:min-w-[220px]"
                >
                  <input type="hidden" name="id" value={vo.id} />
                  <label className="grid gap-1 text-xs w-full">
                    <span className="font-medium text-slate-700">
                      Update status
                    </span>
                    <select
                      name="status"
                      defaultValue={vo.status}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </label>
                  <button
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 shadow-sm"
                    type="submit"
                  >
                    Save status
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
