import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export default async function VendorDetail({ params }: { params: { id: string } }) {
  await requireRole(["ADMIN"]);
  const v = await db.vendor.findFirst({
    where: { id: params.id },
    include: {
      owner: { select: { email: true, name: true } },
      documents: true,
      _count: { select: { products: true, orders: true, documents: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!v) {
    return <div className="text-red-600">Vendor not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{v.shopName}</h1>
        <Link href="/dashboard/admin/vendors" className="rounded-xl border px-3 py-2 hover:bg-gray-50">
          Back
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold mb-3">Profile</h2>
          <dl className="grid grid-cols-3 gap-y-2 text-sm">
            <dt className="text-gray-500">Owner</dt>
            <dd className="col-span-2">
              {v.owner?.name ?? "—"} • {v.owner?.email}
            </dd>

            <dt className="text-gray-500">Status</dt>
            <dd className="col-span-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                v.status === "APPROVED" ? "bg-green-100 text-green-800" :
                v.status === "REJECTED" ? "bg-red-100 text-red-800" :
                v.status === "SUSPENDED" ? "bg-yellow-100 text-yellow-800" :
                "bg-blue-100 text-blue-800"
            }`}>
                {v.status}
            </span>
            </dd>

            <dt className="text-gray-500">Commission</dt>
            <dd className="col-span-2">{v.commissionPct}%</dd>

            <dt className="text-gray-500">BRN</dt>
            <dd className="col-span-2">{v.brn ?? "—"}</dd>

            <dt className="text-gray-500">Tax ID</dt>
            <dd className="col-span-2">{v.taxId ?? "—"}</dd>

            <dt className="text-gray-500">Address</dt>
            <dd className="col-span-2">
              {[v.addressLine1, v.addressLine2, v.city].filter(Boolean).join(", ") || "—"}
            </dd>

            <dt className="text-gray-500">Phone</dt>
            <dd className="col-span-2">{v.phone ?? "—"}</dd>
          </dl>
        </section>

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold mb-3">Bank / Payout</h2>
          <dl className="grid grid-cols-3 gap-y-2 text-sm">
            <dt className="text-gray-500">Method</dt>
            <dd className="col-span-2">{v.payoutMethod ?? "—"}</dd>

            <dt className="text-gray-500">Bank</dt>
            <dd className="col-span-2">
              {[v.bankName, v.bankBranch].filter(Boolean).join(" / ") || "—"}
            </dd>

            <dt className="text-gray-500">Account</dt>
            <dd className="col-span-2">
              {v.bankAccountName ? `${v.bankAccountName} — ${v.bankAccountNo}` : "—"}
            </dd>

            <dt className="text-gray-500">SWIFT</dt>
            <dd className="col-span-2">{v.bankSwift ?? "—"}</dd>
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-semibold mb-3">Documents ({v._count.documents})</h2>
        {v.documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {v.documents.map((d) => (
              <li key={d.id} className="rounded-xl border p-3">
                <div className="text-sm">
                  <div className="font-medium">{d.type}</div>
                  {d.note && <div className="text-gray-600">{d.note}</div>}
                  <div className="text-gray-500">Verified: {d.verified ? "Yes" : "No"}</div>
                </div>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Open
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-semibold mb-3">Stats</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-semibold">{v._count.products}</div>
            <div className="text-gray-500 text-sm">Products</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{v._count.orders}</div>
            <div className="text-gray-500 text-sm">Orders</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{v.commissionPct}%</div>
            <div className="text-gray-500 text-sm">Commission</div>
          </div>
        </div>
      </section>
    </div>
  );
}
