import "./globals.css";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import NavBarServer from "@/components/NavBarServer"; // server wrapper reads cart cookie

export const metadata = {
  title: "Malpra",
  description: "Malpra marketplace built with Next.js",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            {/* Top navigation */}
            <NavBarServer />

            {/* Main content – pages handle their own containers */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="mt-10 border-t bg-white/90 backdrop-blur">
              <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
                {/* Top: columns */}
                <div className="grid gap-8 md:grid-cols-4">
                  {/* Brand / about */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-blue-600 text-xs font-bold text-white">
                        M
                      </span>
                      <span className="text-lg font-semibold tracking-tight">
                        Malpra
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Malpra is your curated marketplace for flowers, cakes,
                      gifts and more – connecting trusted vendors with customers
                      across Sri Lanka.
                    </p>
                    <p className="text-xs text-slate-500">
                      Same-day delivery options, secure payments, and verified
                      vendors to keep your celebrations worry-free.
                    </p>
                  </div>

                  {/* Marketplace links */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Marketplace
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>
                        <a
                          href="/products"
                          className="hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          Browse all products
                        </a>
                      </li>
                      <li>
                        <a
                          href="/products?category=flowers"
                          className="hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          Flowers
                        </a>
                      </li>
                      <li>
                        <a
                          href="/products?category=cakes"
                          className="hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          Cakes
                        </a>
                      </li>
                      <li>
                        <a
                          href="/products?category=perfumes"
                          className="hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          Perfumes &amp; gifts
                        </a>
                      </li>
                      <li>
                        <a
                          href="#vendors"
                          className="hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          Our vendors
                        </a>
                      </li>
                      <li>
                        <a
                          href="#offers"
                          className="hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          Deals &amp; offers
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Help / legal */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Help &amp; Support
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>
                        <a
                          href="/help/faq"
                          className="hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          FAQ
                        </a>
                      </li>
                      <li>
                        <a
                          href="/help/contact"
                          className="hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          Contact support
                        </a>
                      </li>
                      <li>
                        <a
                          href="/help/shipping"
                          className="hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          Delivery &amp; shipping
                        </a>
                      </li>
                      <li>
                        <a
                          href="/legal/terms"
                          className="hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          Terms &amp; conditions
                        </a>
                      </li>
                      <li>
                        <a
                          href="/legal/privacy"
                          className="hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          Privacy policy
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Payment + security row */}
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                  {/* Payments */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-600">
                      We accept
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-semibold tracking-wide text-slate-800">
                        VISA
                      </span>
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-semibold tracking-wide text-slate-800">
                        MasterCard
                      </span>
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-semibold tracking-wide text-slate-800">
                        Amex
                      </span>
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-semibold tracking-wide text-slate-800">
                        Debit card
                      </span>
                      <span className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-[10px] font-semibold tracking-wide text-emerald-700">
                        Cash on delivery
                      </span>
                    </div>
                  </div>

                  {/* Security + little lock icon */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 text-emerald-600"
                      >
                        <path
                          d="M12 2a4 4 0 00-4 4v3H7a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm-2 7V6a2 2 0 114 0v3h-4z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    <span>Secure SSL payments &amp; encrypted checkout.</span>
                  </div>
                </div>

                {/* Bottom bar + social icons */}
                <div className="flex flex-col gap-3 pt-3 text-[11px] md:text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
                  <p>© {year} Malpra. All rights reserved.</p>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                    <p className="flex flex-wrap items-center gap-3">
                      <span>Built for Sri Lankan celebrations.</span>
                      <span className="hidden md:inline-block h-1 w-1 rounded-full bg-slate-300" />
                      <span>Secure payments • Verified vendors</span>
                    </p>

                    {/* Social icons */}
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] uppercase tracking-wide text-slate-500">
                        Follow us
                      </span>
                      <a
                        href="https://facebook.com"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Malpra on Facebook"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-slate-700"
                        >
                          <path
                            fill="currentColor"
                            d="M13 21v-7h2.5l.5-3H13V9.5A1.5 1.5 0 0114.5 8H16V5h-1.5A4.5 4.5 0 0010 9.5V11H8v3h2v7h3z"
                          />
                        </svg>
                      </a>
                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Malpra on Instagram"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-slate-700"
                        >
                          <path
                            fill="currentColor"
                            d="M8 3h8a5 5 0 015 5v8a5 5 0 01-5 5H8a5 5 0 01-5-5V8a5 5 0 015-5zm0 2a3 3 0 00-3 3v8a3 3 0 003 3h8a3 3 0 003-3V8a3 3 0 00-3-3H8zm4 2.5A4.5 4.5 0 1112 16a4.5 4.5 0 010-9zm0 2A2.5 2.5 0 1014.5 12 2.5 2.5 0 0012 9.5zm5.25-3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                          />
                        </svg>
                      </a>
                      <a
                        href="https://wa.me/94700000000"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Chat on WhatsApp"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-slate-700"
                        >
                          <path
                            fill="currentColor"
                            d="M12.04 3a8.9 8.9 0 00-7.6 13.58L3 21l4.53-1.37A8.9 8.9 0 1012.04 3zm0 2a6.9 6.9 0 015.92 10.5.9.9 0 00-.11.82l.74 2.2-2.25-.7a.9.9 0 00-.82.12A6.9 6.9 0 115.14 12a6.86 6.86 0 001.02 3.56.9.9 0 00.11.94L5.7 18.9l1.45-.44a.9.9 0 00.54-.43A6.9 6.9 0 0112.04 5zm-3.3 3.3c-.2 0-.52.06-.8.38-.27.32-1.04 1-1.04 2.43s1.07 2.82 1.22 3.01c.15.19 2.1 3.32 5.19 4.52.73.29 1.3.46 1.75.59.74.21 1.41.18 1.94.11.59-.09 1.82-.74 2.08-1.45.26-.71.26-1.32.18-1.45-.08-.13-.29-.21-.6-.37s-1.82-.9-2.1-1a.47.47 0 00-.65.14c-.19.28-.74.9-.91 1.08-.17.19-.34.21-.63.07-.29-.15-1.22-.45-2.33-1.42-.86-.76-1.42-1.69-1.58-1.97-.16-.28-.02-.44.12-.58.13-.13.29-.34.44-.51.15-.17.2-.28.3-.47.1-.19.05-.36 0-.51-.05-.15-.45-1.11-.64-1.52-.16-.35-.32-.35-.52-.36z"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
