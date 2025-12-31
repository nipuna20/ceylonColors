import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { saveAdminName, changeAdminPassword } from "./actions";

export default async function AdminProfilePage() {
  const session = await requireRole(["ADMIN"]);
  const userId = (session.user as any).id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin profile</h1>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium">Account</h2>
        <form action={saveAdminName} className="flex gap-2">
          <input
            name="name"
            defaultValue={user?.name ?? ""}
            className="flex-1 rounded-xl border px-3 py-2"
          />
          <button className="rounded-xl border px-4 py-2 hover:bg-gray-50">Save</button>
        </form>
        <div className="mt-2 text-sm text-gray-600">Email: {user?.email}</div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium">Change password</h2>
        <form action={changeAdminPassword} className="flex gap-2 max-w-md">
          <input
            name="password"
            type="password"
            placeholder="New password"
            className="flex-1 rounded-xl border px-3 py-2"
          />
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-white">Update</button>
        </form>
      </div>
    </div>
  );
}
