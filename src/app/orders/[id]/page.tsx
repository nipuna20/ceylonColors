import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

function fmt(d: Date) {
  return new Date(d).toISOString().slice(0, 19).replace("T", " ");
}

export default async function AdminOrderDetail({
  params,
}: { params: { id: string } }) {
  await requireRole(["ADMIN"]);

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      buyer: { select: { email: true, name: true, id: true } },
      items: { include: { product: true, variant: true } },
      vendorOrders: { include: { vendor: true } },
      payment: true, // if you added Payment relation on Order
    },
  });

  if (!order) notFound();

  const shipping = (order.shippingAddr ?? {}) as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Order #{order.id.slice(0, 8)}
        </h1>
        <Link
          href="/dashboard/admin"
          className="rounded-xl border px-3 py-2 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {/* Head */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-lg font-semibold">{order.status}</div>
          <div className="mt-2 text-sm text-gray-600">
            Created: {fmt(order.createdAt)}
          </div>
          {order.paidAt && (
            <div className="text-sm text-gray-600">Paid: {fmt(order.paidAt)}</div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Buyer</div>
          <div className="text-lg font-semibold">
            {order.buyer?.name ?? "—"}
          </div>
          <div className="text-sm text-gray-600">{order.buyer?.email}</div>
          <div className="mt-2 text-sm text-gray-500">
            Buyer ID: {order.buyer?.id}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Totals</div>
          <div className="text-lg font-semibold">
            LKR {(order.totalCents / 100).toFixed(2)}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Payment method: {order.paymentMethod}
          </div>
          {order.payment && (
            <div className="mt-2 text-sm text-gray-600">
              Gateway: {order.payment.gateway} • Status:{" "}
              <b>{order.payment.status}</b>
              <br />
              Amount: LKR {(order.payment.amountCents / 100).toFixed(2)}
              {order.payment.externalRef && (
                <>
                  <br />
                  Ref: {order.payment.externalRef}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Shipping */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 font-medium">Shipping</h2>
        {order.shippingAddr ? (
          <div className="text-sm text-gray-700">
            <div>{shipping.name}</div>
            <div>{shipping.phone}</div>
            <div>
              {[shipping.line1, shipping.line2]
                .filter(Boolean)
                .join(", ")}
            </div>
            <div>
              {[shipping.city, shipping.postal, shipping.country]
                .filter(Boolean)
                .join(" ")}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No shipping address.</div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 font-medium">Items</h2>
        <ul className="grid gap-2">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{i.product.title}</div>
                {i.variant && (
                  <div className="text-gray-500">
                    Variant: {i.variant.name}
                  </div>
                )}
                <div className="text-gray-500">Qty: {i.qty}</div>
              </div>
              <div className="font-medium">
                LKR {((i.priceCents * i.qty) / 100).toFixed(2)}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Vendor splits */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 font-medium">Vendor orders</h2>
        {order.vendorOrders.length === 0 ? (
          <div className="text-sm text-gray-500">No vendor splits.</div>
        ) : (
          <ul className="grid gap-2">
            {order.vendorOrders.map((vo) => (
              <li key={vo.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{vo.vendor.shopName}</div>
                  <div className="text-gray-500">Status: {vo.status}</div>
                </div>
                <div className="font-medium">
                  LKR {(vo.subtotalCents / 100).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
