import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

function firstLastOfMonth(ym: string) {
  // ym = "YYYY-MM"
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // last day
  const endExclusive = new Date(Date.UTC(y, m, 1)); // first of next month
  return { start, end, endExclusive };
}

export async function GET(req: Request) {
  await requireRole(["VENDOR"]);
  const url = new URL(req.url);
  const ym = url.searchParams.get("month"); // "YYYY-MM"
  if (!ym) {
    return NextResponse.json({ error: "month=YYYY-MM is required" }, { status: 400 });
  }
  const { start, endExclusive } = firstLastOfMonth(ym);

  // Who is the vendor?
  // requireRole returns a session; but we only need vendor by owner id:
  // We'll fetch via rbac again to get user id.
  // (No extra call; requireRole already ensured and we can re-call cleanly here)
  // Import rbac returns session; but in this file we used only requireRole for auth gate.
  // Re-run to get session:
  const session = await requireRole(["VENDOR"]);
  const uid = (session.user as any).id;
  const vendor = await db.vendor.findUnique({ where: { ownerId: uid } });
  if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

  const vos = await db.vendorOrder.findMany({
    where: {
      vendorId: vendor.id,
      status: "COMPLETED",
      order: { is: { createdAt: { gte: start, lt: endExclusive } } },
    },
    include: { order: { select: { id: true, createdAt: true } } },
    orderBy: { id: "asc" },
  });

  const pct = vendor.commissionPct ?? 10;

  const rows = [
    ["Vendor", vendor.shopName],
    ["Month", ym],
    [],
    ["VendorOrderID", "OrderID", "Date", "Status", "Subtotal(LKR)", "Commission(%)", "Commission(LKR)", "Net(LKR)"],
  ];

  let totalSub = 0, totalComm = 0, totalNet = 0;
  for (const vo of vos) {
    const sub = vo.subtotalCents / 100;
    const comm = Math.round(vo.subtotalCents * pct / 100) / 100;
    const net = sub - comm;
    totalSub += sub; totalComm += comm; totalNet += net;
    rows.push([
      vo.id,
      vo.order.id,
      vo.order.createdAt.toISOString().slice(0,10),
      vo.status,
      sub.toFixed(2),
      String(pct),
      comm.toFixed(2),
      net.toFixed(2),
    ]);
  }

  rows.push([]);
  rows.push(["TOTAL", "", "", "", totalSub.toFixed(2), "", totalComm.toFixed(2), totalNet.toFixed(2)]);

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="malpra-statement-${ym}.csv"`,
    },
  });
}
