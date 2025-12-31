import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { saveVendorProfile } from "./actions";

export default async function VendorProfilePage() {
  const session = await requireRole(["VENDOR"]);
  const userId = (session.user as any).id;

  const vendor = await db.vendor.findUnique({ where: { ownerId: userId } });
  if (!vendor) return <div className="text-red-600">Vendor profile not found.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Vendor profile</h1>

      <form action={saveVendorProfile} className="grid gap-3 max-w-2xl rounded-xl border bg-white p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Shop name</span>
            <input name="shopName" defaultValue={vendor.shopName} className="rounded-xl border px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Slug</span>
            <input name="slug" defaultValue={vendor.slug} className="rounded-xl border px-3 py-2" />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Description</span>
          <textarea name="description" defaultValue={vendor.description ?? ""} rows={3} className="rounded-xl border px-3 py-2" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Logo URL</span>
            <input name="logoUrl" defaultValue={vendor.logoUrl ?? ""} className="rounded-xl border px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Cover URL</span>
            <input name="coverUrl" defaultValue={vendor.coverUrl ?? ""} className="rounded-xl border px-3 py-2" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Approved: {vendor.isApproved ? "Yes" : "No"}</div>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-white">Save</button>
        </div>
      </form>
    </div>
  );
}
