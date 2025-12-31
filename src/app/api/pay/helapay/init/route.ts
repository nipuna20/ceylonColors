import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { helapayCheckoutUrl, helapayMerchantId, input } from "@/lib/helapay";

export async function GET(req: Request) {
  console.log("[helapay:init] hit");
  const session = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
  const uid = (session.user as any).id;
  const role = (session.user as any).role as "BUYER" | "VENDOR" | "ADMIN";

  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) {
    console.error("[helapay:init] missing orderId");
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { buyer: true },
  });

  if (!order) {
    console.error("[helapay:init] order not found", { orderId });
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Allow ADMIN to init any order; others must own it
  if (role !== "ADMIN" && order.buyerId !== uid) {
    console.error("[helapay:init] buyer mismatch", { orderBuyerId: order.buyerId, uid });
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Ensure Payment row (HELAPAY)
  await db.payment.upsert({
    where: { orderId },
    update: {
      amountCents: order.totalCents,
      method: "HELAPAY",
      gateway: "HELAPAY",
      status: "INITIATED",
    },
    create: {
      orderId,
      amountCents: order.totalCents,
      method: "HELAPAY",
      gateway: "HELAPAY",
      status: "INITIATED",
    },
  });

  const merchant_id = helapayMerchantId();
  const return_url = process.env.HELAPAY_RETURN_URL!;
  const cancel_url = process.env.HELAPAY_CANCEL_URL!;
  const notify_url = process.env.HELAPAY_NOTIFY_URL!;
  const amount = (order.totalCents / 100).toFixed(2);
  const currency = "LKR";
  const action = helapayCheckoutUrl();

  if (!merchant_id || !action) {
    console.error("[helapay:init] misconfig", { merchant_id, action });
    return NextResponse.json({ error: "HelaPay misconfigured" }, { status: 500 });
  }

  console.log("[helapay:init] ready", {
    uid, role, orderId: order.id,
    mode: process.env.HELAPAY_MODE,
    endpoint: action,
    merchant_id: merchant_id.slice(0, 2) + "***",
    amount
  });

  const fields: Record<string, string> = {
    merchant_id,
    order_id: order.id,
    amount,
    currency,
    return_url,
    cancel_url,
    notify_url,
    customer_name: order.buyer?.name ?? "Customer",
    customer_email: order.buyer?.email ?? "",
    customer_phone: "",
    customer_address: "",
    customer_city: "",
    customer_country: "LK",
    description: `Order ${order.id}`,
  };

  const html = `<!doctype html><html><body>
    <p style="font:14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial">
      Redirecting to HelaPay...
    </p>
    <form id="f" method="post" action="${action}">
      ${Object.entries(fields).map(([k, v]) => input(k, String(v))).join("\n")}
    </form>
    <script>document.getElementById("f").submit()</script>
  </body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
