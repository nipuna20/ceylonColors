import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await requireRole(["ADMIN"]);
  const adminId = (session.user as any).id;

  const form = await req.formData();
  const action = String(form.get("action") || "");

  try {
    if (action === "SET_COMMISSION") {
      const id = String(form.get("id"));
      const pct = Math.max(0, Math.min(100, Number(form.get("commissionPct") ?? 0)));
      await db.vendor.update({ where: { id }, data: { commissionPct: Math.round(pct) } });
    } else if (action === "SET_STATUS") {
      const id = String(form.get("id"));
      const status = String(form.get("status")) as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

      const base = {
        status,
        isApproved: status === "APPROVED",
        rejectionReason: status === "REJECTED" ? "Rejected by admin" : null,
        approvedById: status === "APPROVED" ? adminId : null,
        approvedAt: status === "APPROVED" ? new Date() : null,
        rejectedAt: status === "REJECTED" ? new Date() : null,
      };

      await db.vendor.update({ where: { id }, data: base });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("[admin/vendors/actions] error", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // go back to the vendors list preserving current query if any
  return NextResponse.redirect(new URL("/dashboard/admin/vendors", req.url));
}
