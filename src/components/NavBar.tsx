"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export default function NavBar({ cartCount = 0 }: { cartCount?: number }) {
  const { data } = useSession();
  const role = (data?.user as any)?.role as
    | "BUYER"
    | "VENDOR"
    | "ADMIN"
    | undefined;
  const userName = (data?.user as any)?.name as string | undefined;

  const [openMobile, setOpenMobile] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);

  const roleLabel =
    role === "BUYER" ? "Buyer" : role === "VENDOR" ? "Vendor" : role === "ADMIN" ? "Admin" : null;

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      {/* top accent bar */}
      <div className="h-1 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600" />

      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* BRAND + LOGO */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <div className="relative h-8 w-8 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <Image
              src="/images/logo/ceyloncolors.jpg"
              alt="Malpra logo"
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>
          <span className="bg-gradient-to-r from-fuchsia-600 to-blue-600 bg-clip-text text-transparent">
            Malpra
          </span>
        </Link>

        {/* PRIMARY LINKS (desktop) */}
        <div className="hidden md:flex items-center gap-4 ml-6 text-sm">
          <Link
            href="/products"
            className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
          >
            Products
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            {/* cart icon */}
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M7 4h-2l-1 4m0 0l2 9h11l2-9H4z"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={10} cy={19} r={1} />
              <circle cx={17} cy={19} r={1} />
            </svg>
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="ml-0.5 rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* SEARCH (desktop) */}
        <form
          action="/products"
          method="get"
          className="hidden md:flex items-center ml-auto max-w-md flex-1 gap-2"
        >
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <svg
                className="h-4 w-4 text-slate-400"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M11 5a6 6 0 014.472 10.027l3.25 3.25-1.414 1.414-3.25-3.25A6 6 0 1111 5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              name="q"
              placeholder="Search flowers, cakes, gifts…"
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-9 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            Search
          </button>
        </form>

        {/* RIGHT SIDE (desktop): auth / user */}
        <div className="hidden md:flex items-center gap-2 ml-3">
          {!role && (
            <>
              <Link
                href="/auth/signin"
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-gradient-to-r from-fuchsia-600 to-blue-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
              >
                Sign up
              </Link>
            </>
          )}

          {role && (
            <>
              {/* role chip */}
              {roleLabel && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-700">
                  {roleLabel}
                </span>
              )}

              {/* quick dashboard link */}
              {role === "BUYER" && (
                <Link
                  href="/dashboard/buyer"
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  My orders
                </Link>
              )}
              {role === "VENDOR" && (
                <Link
                  href="/dashboard/vendor"
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Vendor dashboard
                </Link>
              )}
              {role === "ADMIN" && (
                <Link
                  href="/dashboard/admin"
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Admin panel
                </Link>
              )}

              {/* profile / menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenUserMenu((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-blue-500 text-[11px] font-semibold text-white">
                    {userName?.[0]?.toUpperCase() ?? roleLabel?.[0] ?? "M"}
                  </span>
                  <span className="hidden sm:inline max-w-[90px] truncate text-left">
                    {userName ?? "Account"}
                  </span>
                  <svg
                    className={`h-3 w-3 text-slate-500 transition-transform ${
                      openUserMenu ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      d="M5.25 7.5L10 12.25 14.75 7.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {openUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/40 text-sm overflow-hidden">
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="truncate text-sm font-medium text-slate-800">
                        {userName ?? (data?.user as any)?.email ?? "User"}
                      </p>
                    </div>

                    <div className="max-h-72 overflow-y-auto py-1">
                      {/* BUYER LINKS */}
                      {role === "BUYER" && (
                        <>
                          <NavItem href="/dashboard/buyer">My orders</NavItem>
                          <NavItem href="/dashboard/buyer/profile">
                            Profile
                          </NavItem>
                          <NavItem href="/cart">
                            Cart{cartCount ? ` (${cartCount})` : ""}
                          </NavItem>
                        </>
                      )}

                      {/* VENDOR LINKS */}
                      {role === "VENDOR" && (
                        <>
                          <NavItem href="/dashboard/vendor">Overview</NavItem>
                          <NavItem href="/dashboard/vendor/products">
                            Products
                          </NavItem>
                          <NavItem href="/dashboard/vendor/orders">
                            Orders
                          </NavItem>
                          <NavItem href="/dashboard/vendor/finances">
                            Finances
                          </NavItem>
                          <NavItem href="/dashboard/vendor/finances/statements">
                            Statements
                          </NavItem>
                          <NavItem href="/dashboard/vendor/finances/realtime">
                            Realtime
                          </NavItem>
                          <NavItem href="/dashboard/vendor/disputes/new">
                            Dispute
                          </NavItem>
                          <NavItem href="/dashboard/vendor/cod">COD</NavItem>
                          <NavItem href="/dashboard/vendor/finances/receivables">
                            Receivables
                          </NavItem>
                          <NavItem href="/dashboard/vendor/profile">
                            Profile
                          </NavItem>
                        </>
                      )}

                      {/* ADMIN LINKS */}
                      {role === "ADMIN" && (
                        <>
                          <NavItem href="/dashboard/admin">Stats</NavItem>
                          <NavItem href="/dashboard/admin/vendors">
                            Vendors
                          </NavItem>
                          <NavItem href="/dashboard/admin/products">
                            Products
                          </NavItem>
                          <NavItem href="/dashboard/admin/categories">
                            Categories
                          </NavItem>
                          <NavItem href="/dashboard/admin/payouts">
                            Payouts
                          </NavItem>
                          <NavItem href="/dashboard/admin/vendors/commissions">
                            Commissions
                          </NavItem>
                          <NavItem href="/dashboard/admin/payouts/online">
                            Online payouts
                          </NavItem>
                          <NavItem href="/dashboard/admin/profile">
                            Profile
                          </NavItem>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      <span>Sign out</span>
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M13 4H6a2 2 0 00-2 2v12a2 2 0 002 2h7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 12h9m0 0l-3-3m3 3l-3 3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* MOBILE: menu button + small cart */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Link
            href="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white"
          >
            <svg
              className="h-5 w-5 text-slate-700"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M7 4h-2l-1 4m0 0l2 9h11l2-9H4z"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={10} cy={19} r={1} />
              <circle cx={17} cy={19} r={1} />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="rounded-full border border-slate-200 p-2"
            onClick={() => setOpenMobile((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="block h-0.5 w-5 bg-slate-800" />
            <span className="mt-1 block h-0.5 w-5 bg-slate-800" />
            <span className="mt-1 block h-0.5 w-5 bg-slate-800" />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {openMobile && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-2 shadow-sm">
          <Link
            href="/products"
            className="block rounded-xl border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Products
          </Link>
          <Link
            href="/cart"
            className="block rounded-xl border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cart{cartCount ? ` (${cartCount})` : ""}
          </Link>

          {!role && (
            <>
              <Link
                href="/auth/signin"
                className="block rounded-xl border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="block rounded-xl bg-gradient-to-r from-fuchsia-600 to-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:opacity-95"
              >
                Sign up
              </Link>
            </>
          )}

          {role === "BUYER" && (
            <>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Your account
              </p>
              <Link
                href="/dashboard/buyer"
                className="block rounded-xl border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                My orders
              </Link>
              <Link
                href="/dashboard/buyer/profile"
                className="block rounded-xl border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left rounded-xl border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </>
          )}

          {role === "VENDOR" && (
            <>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Vendor
              </p>
              <Link href="/dashboard/vendor" className="mobileLink">
                Overview
              </Link>
              <Link href="/dashboard/vendor/products" className="mobileLink">
                Products
              </Link>
              <Link href="/dashboard/vendor/orders" className="mobileLink">
                Orders
              </Link>
              <Link href="/dashboard/vendor/finances" className="mobileLink">
                Finances
              </Link>
              <Link
                href="/dashboard/vendor/finances/statements"
                className="mobileLink"
              >
                Statements
              </Link>
              <Link
                href="/dashboard/vendor/finances/realtime"
                className="mobileLink"
              >
                Realtime
              </Link>
              <Link href="/dashboard/vendor/disputes/new" className="mobileLink">
                Dispute
              </Link>
              <Link href="/dashboard/vendor/cod" className="mobileLink">
                COD
              </Link>
              <Link
                href="/dashboard/vendor/finances/receivables"
                className="mobileLink"
              >
                Receivables
              </Link>
              <Link href="/dashboard/vendor/profile" className="mobileLink">
                Profile
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left rounded-xl border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </>
          )}

          {role === "ADMIN" && (
            <>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Admin
              </p>
              <Link href="/dashboard/admin" className="mobileLink">
                Stats
              </Link>
              <Link href="/dashboard/admin/vendors" className="mobileLink">
                Vendors
              </Link>
              <Link href="/dashboard/admin/products" className="mobileLink">
                Products
              </Link>
              <Link href="/dashboard/admin/categories" className="mobileLink">
                Categories
              </Link>
              <Link href="/dashboard/admin/payouts" className="mobileLink">
                Payouts
              </Link>
              <Link
                href="/dashboard/admin/vendors/commissions"
                className="mobileLink"
              >
                Commissions
              </Link>
              <Link
                href="/dashboard/admin/payouts/online"
                className="mobileLink"
              >
                Online payouts
              </Link>
              <Link href="/dashboard/admin/profile" className="mobileLink">
                Profile
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left rounded-xl border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}

/** Small helper for dropdown links */
function NavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}
