import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

// ✅ make a simple union for the filter
type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "ALL";

type Search = {
  searchParams?: {
    q?: string;
    status?: StatusFilter;
  };
};

export default async function AdminVendors({ searchParams }: Search) {
  await requireRole(["ADMIN"]);

  const q = (searchParams?.q ?? "").trim();
  const status: StatusFilter = (searchParams?.status ?? "PENDING") as StatusFilter;

  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (q) {
    where.OR = [
      { shopName: { contains: q, mode: "insensitive" } },
      { owner: { is: { email: { contains: q, mode: "insensitive" } } } },
      { owner: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const vendors = await db.vendor.findMany({
    where,
    include: {
      owner: { select: { email: true, name: true } },
      _count: { select: { products: true, documents: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // ✅ use the union type here
  const tabs: { label: string; key: StatusFilter }[] = [
    { label: "Pending", key: "PENDING" },
    { label: "Approved", key: "APPROVED" },
    { label: "Rejected", key: "REJECTED" },
    { label: "Suspended", key: "SUSPENDED" },
    { label: "All", key: "ALL" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Vendors</h1>
        <form method="get" className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by shop, email or name…"
            className="rounded-xl border px-3 py-2 text-sm"
          />
          {status && <input type="hidden" name="status" value={status} />}
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => {
          const href =
            "/dashboard/admin/vendors?" +
            new URLSearchParams({ ...(q ? { q } : {}), status: t.key ?? "ALL" }).toString();
        return (
          <Link
            key={t.key}
            href={href}
            className={
              "rounded-full border px-3 py-1 text-sm " +
              (status === t.key
                ? "bg-gray-900 text-white"
                : "hover:bg-gray-50")
            }
          >
            {t.label}
          </Link>
        )})}
      </div>

      <ul className="grid gap-3">
        {vendors.map((v) => (
          <li key={v.id} className="rounded-2xl border bg-white p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{v.shopName}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{v.status}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {v.commissionPct}% commission
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Owner: {v.owner.name ?? "—"} • {v.owner.email}
              </div>
              <div className="text-xs text-gray-500">
                Products {v._count.products} • Docs {v._count.documents} • Orders {v._count.orders}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/admin/vendors/${v.id}`}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Review
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
