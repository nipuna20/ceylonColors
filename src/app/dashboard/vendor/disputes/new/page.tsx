import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import DisputeForm from "../DisputeForm";

export default async function NewDisputePage() {
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;

  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });
  if (!vendor) return <div className="text-red-600">Vendor profile not found.</div>;

  const payouts = await db.payout.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const supportEmail = "support@malpra.local";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dispute a payout</h1>

      {payouts.length === 0 ? (
        <div className="rounded-2xl border bg-white p-5 text-sm text-gray-600">
          You have no payouts yet. Once payouts appear, you can dispute a row here.
        </div>
      ) : (
        <DisputeForm
          supportEmail={supportEmail}
          vendorShopName={vendor.shopName}
          payouts={payouts.map((p) => ({
            id: p.id,
            status: p.status,
            amountLKR: (p.amountCents / 100).toFixed(2),
          }))}
        />
      )}
    </div>
  );
}
