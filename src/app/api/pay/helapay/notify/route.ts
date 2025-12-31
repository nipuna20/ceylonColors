// src/app/api/pay/helapay/notify/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyHelaPaySignature } from "@/lib/helapay";

/** Parse either form-encoded or JSON body into a flat object */
async function parseBody(req: Request): Promise<Record<string, any>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await req.json().catch(() => ({}));
    return j || {};
  }
  const text = await req.text();
  const params = new URLSearchParams(text);
  const out: Record<string, any> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

/** Determine success based on common gateway fields */
function isSuccess(payload: Record<string, any>) {
  const raw = String(
    payload.status ??
    payload.payment_status ??
    payload.state ??
    payload.status_code ??
    ""
  ).toUpperCase();

  const code = String(payload.code ?? payload.status_code ?? "").toUpperCase();

  // Accept common variants
  if (["SUCCESS", "PAID", "CAPTURED", "COMPLETED"].includes(raw)) return true;
  if (["00", "0", "2"].includes(code)) return true;

  return false;
}

export async function POST(req: Request) {
  const payload = await parseBody(req);

  // Verify signature if present
  const okSig = verifyHelaPaySignature(
    Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, typeof v === "string" ? v : String(v)]))
  );
  if (!okSig) return NextResponse.json({ error: "bad-signature" }, { status: 400 });

  const order_id = String(payload.order_id ?? payload.orderId ?? "");
  if (!order_id) return NextResponse.json({ error: "missing-order-id" }, { status: 400 });

  const existing = await db.order.findUnique({ where: { id: order_id } });
  if (!existing) return NextResponse.json({ error: "order-not-found" }, { status: 404 });

  const paid = isSuccess(payload);

  // Update payment row
  await db.payment.updateMany({
    where: { orderId: order_id },
    data: {
      status: paid ? "PAID" : "FAILED",
      externalRef: String(payload.payment_id ?? payload.txn_id ?? payload.transaction_id ?? ""),
      raw: payload,
      method: "HELAPAY",
      gateway: "HELAPAY",
    },
  });

  if (paid) {
    await db.order.update({
      where: { id: order_id },
      data: {
        status: "PAID",
        paymentMethod: "HELAPAY",
        paidAt: new Date(),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
