import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { saveBuyerName, saveDefaultAddress } from "./actions";
import BuyerAvatarUploader from "./BuyerAvatarUploader";

export default async function BuyerProfilePage() {
  const { user } = await requireRole(["BUYER"]);
  const uid = (user as any).id;

  const [me, addr] = await Promise.all([
    db.user.findUnique({
      where: { id: uid },
      select: { name: true, email: true }, 
    }),
    db.address.findFirst({
      where: { userId: uid, isDefault: true },
    }),
  ]);

  const displayName = me?.name || me?.email || "Buyer";

  return (
    <div className="min-h-[60vh] space-y-6 max-w-4xl mx-auto px-4 lg:px-0">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar upload */}
            <BuyerAvatarUploader
              initialUrl={(me as any)?.avatarUrl ?? null}  // Change this to match `initialUrl` in the child component
            />


          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Buyer profile
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your personal details, profile photo and default shipping
              address.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M6 12l3 3 9-9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Logged in as</span>
          </div>
          <div className="mt-0.5 text-[11px] font-medium text-slate-900 truncate max-w-[220px]">
            {me?.email}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
        {/* Account card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-600/10 text-blue-600">
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 12a4 4 0 100-8 4 4 0 000 8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.7}
                      strokeLinecap="round"
                    />
                    <path
                      d="M5 20c1.5-2.5 4-4 7-4s5.5 1.5 7 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.7}
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                Account details
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Your name is used on invoices and order emails.
              </p>
            </div>
          </div>

          <form action={saveBuyerName} className="space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              Display name
              <div className="mt-1 flex gap-2">
                <input
                  name="name"
                  defaultValue={me?.name ?? ""}
                  placeholder="Enter your full name"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">
                  Save
                </button>
              </div>
            </label>

            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[9px] text-slate-700">
                  @
                </span>
                <div>
                  <div className="font-medium text-slate-800">
                    {me?.email ?? "Email not available"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    This is your login email and cannot be changed here.
                  </div>
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* Address card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600/10 text-emerald-600">
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 21s-6-4.5-6-10a6 6 0 1112 0c0 5.5-6 10-6 10z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx={12}
                      cy={11}
                      r={2.3}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.7}
                    />
                  </svg>
                </span>
                Default shipping address
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                This address will be pre-filled during checkout.
              </p>
            </div>
          </div>

          <form
            action={saveDefaultAddress}
            className="grid gap-3 md:grid-cols-2 md:gap-4"
          >
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                Address line 1
                <input
                  name="line1"
                  defaultValue={addr?.line1 ?? ""}
                  placeholder="House / apartment number, street"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                Address line 2 (optional)
                <input
                  name="line2"
                  defaultValue={addr?.line2 ?? ""}
                  placeholder="Apartment, floor, landmark"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                City
                <input
                  name="city"
                  defaultValue={addr?.city ?? ""}
                  placeholder="City"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Postal code
                <input
                  name="postal"
                  defaultValue={addr?.postal ?? ""}
                  placeholder="Postal code"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Phone number
                <input
                  name="phone"
                  defaultValue={addr?.phone ?? ""}
                  placeholder="Mobile used by courier"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>
            </div>

            <div className="md:col-span-2 flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-500 max-w-xs">
                Couriers will use this address and phone number to deliver your
                orders. Make sure everything is up to date.
              </p>
              <button className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700">
                Save address
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
