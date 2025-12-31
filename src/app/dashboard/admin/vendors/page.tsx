import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

// no stale cache
export const dynamic = "force-dynamic";

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "ALL";

type Search = {
  searchParams?: {
    q?: string | string[];
    status?: string | string[];
  };
};

// --- helpers ---
function readParam(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v ?? "";
}
function parseStatus(v?: string | string[]): StatusFilter {
  const s = readParam(v).toUpperCase();
  const allowed: StatusFilter[] = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "ALL"];
  return (allowed.includes(s as StatusFilter) ? (s as StatusFilter) : "ALL");
}
function statusTone(s: StatusFilter | string) {
  switch (s) {
    case "APPROVED": return "green" as const;
    case "REJECTED": return "red" as const;
    case "SUSPENDED": return "yellow" as const;
    case "PENDING": return "blue" as const;
    default: return "gray" as const;
  }
}
function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "red" | "yellow" | "blue";
}) {
  const cx =
    tone === "green" ? "bg-green-100 text-green-800"
    : tone === "red" ? "bg-red-100 text-red-800"
    : tone === "yellow" ? "bg-yellow-100 text-yellow-800"
    : tone === "blue" ? "bg-blue-100 text-blue-800"
    : "bg-gray-100 text-gray-800";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cx}`}>{children}</span>;
}

export default async function AdminVendors({ searchParams }: Search) {
  await requireRole(["ADMIN"]);

  const q = readParam(searchParams?.q).trim();
  const status = parseStatus(searchParams?.status);

  // Build where with legacy compatibility (older rows using isApproved)
  const where: any = {};
  if (status !== "ALL") {
    if (status === "APPROVED") {
      where.OR = [{ status: "APPROVED" }, { isApproved: true }];
    } else if (status === "PENDING") {
      where.OR = [{ status: "PENDING" }, { isApproved: false }];
    } else {
      where.status = status; // REJECTED/SUSPENDED
    }
  }
  if (q) {
    where.OR = [
      ...(where.OR ?? []),
      { shopName: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { owner: { is: { email: { contains: q, mode: "insensitive" } } } },
      { owner: { is: { name: { contains: q, mode: "insensitive" } } } },
      { taxId: { contains: q, mode: "insensitive" } },
      { brn: { contains: q, mode: "insensitive" } },
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

  const tabs: { label: string; key: StatusFilter }[] = [
    { label: "Pending", key: "PENDING" },
    { label: "Approved", key: "APPROVED" },
    { label: "Rejected", key: "REJECTED" },
    { label: "Suspended", key: "SUSPENDED" },
    { label: "All", key: "ALL" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-2xl font-semibold">Vendors</h1>
        <form method="get" className="flex items-center gap-2">
          <input
            name="q"
            placeholder="Search shop/owner/email/BRN"
            defaultValue={q}
            className="rounded-xl border px-3 py-2 text-sm"
          />
          <input type="hidden" name="status" value={status} />
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Search</button>
        </form>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => {
          const href = `?status=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
          const active = t.key === status;
          return (
            <Link
              key={t.key}
              href={href}
              className={`rounded-full px-3 py-1 text-sm border ${
                active ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-50"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Counts</th>
              <th className="px-4 py-3">KYC</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{v.shopName}</div>
                  <div className="text-gray-500">{v.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{v.owner?.name ?? "—"}</div>
                  <div className="text-gray-500">{v.owner?.email}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(v.status)}>{v.status}</Badge>
                </td>
                <td className="px-4 py-3">{v.commissionPct}%</td>
                <td className="px-4 py-3 text-gray-700">
                  <div>{v._count.products} products</div>
                  <div>{v._count.orders} orders</div>
                  <div>{v._count.documents} docs</div>
                </td>
                <td className="px-4 py-3">
                  {v.kycSubmittedAt ? (
                    <Badge tone="blue">Submitted</Badge>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </td>
                <td className="px-4 py-3">{new Date(v.createdAt).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/admin/vendors/${v.id}`} className="rounded-xl border px-3 py-1 hover:bg-gray-50">View</Link>

                    {/* Commission inline update */}
                    <form action={`/dashboard/admin/vendors/actions`} method="post" className="flex items-center gap-1">
                      <input type="hidden" name="action" value="SET_COMMISSION" />
                      <input type="hidden" name="id" value={v.id} />
                      <input
                        name="commissionPct"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={v.commissionPct}
                        className="w-20 rounded-lg border px-2 py-1"
                        aria-label="Commission %"
                      />
                      <button className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50">Save</button>
                    </form>

                    {/* Status actions */}
                    {v.status !== "APPROVED" && (
                      <form action={`/dashboard/admin/vendors/actions`} method="post">
                        <input type="hidden" name="action" value="SET_STATUS" />
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <button className="rounded-xl border px-3 py-1 text-xs hover:bg-gray-50">Approve</button>
                      </form>
                    )}
                    {v.status !== "REJECTED" && (
                      <form action={`/dashboard/admin/vendors/actions`} method="post">
                        <input type="hidden" name="action" value="SET_STATUS" />
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <button className="rounded-xl border px-3 py-1 text-xs hover:bg-gray-50">Reject</button>
                      </form>
                    )}
                    {v.status !== "SUSPENDED" && (
                      <form action={`/dashboard/admin/vendors/actions`} method="post">
                        <input type="hidden" name="action" value="SET_STATUS" />
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="status" value="SUSPENDED" />
                        <button className="rounded-xl border px-3 py-1 text-xs hover:bg-gray-50">Suspend</button>
                      </form>
                    )}
                    {(v.status === "SUSPENDED" || v.status === "REJECTED") && (
                      <form action={`/dashboard/admin/vendors/actions`} method="post">
                        <input type="hidden" name="action" value="SET_STATUS" />
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <button className="rounded-xl border px-3 py-1 text-xs hover:bg-gray-50">Reinstate</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={8}>
                  No vendors match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
