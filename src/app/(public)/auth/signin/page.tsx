// src/app/(public)/auth/signin/page.tsx
"use client"; // Explicitly mark the page as client-side rendered

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // Using searchParams from next/navigation
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  const [callbackUrl, setCallbackUrl] = useState<string>("/"); // Default value is "/"
  const sp = useSearchParams(); // Will get the searchParams

  // Use `useEffect` to ensure this runs only on the client-side
  useEffect(() => {
    const url = sp.get("callbackUrl");
    setCallbackUrl(url || "/"); // Set the callback URL
  }, [sp]); // The effect runs when `sp` changes

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl,
      });
      // In most cases NextAuth redirects automatically.
      if (res && (res as any).error) {
        setError("Invalid email or password");
        setBusy(false);
      }
    } catch {
      setError("Unable to sign in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)] items-stretch">
        {/* LEFT PANEL / BRANDING */}
        <section className="hidden lg:flex flex-col rounded-3xl bg-gradient-to-br from-sky-600 via-indigo-600 to-purple-600 text-white p-8 shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Secure sign in
          </div>

          <div className="mt-6 space-y-3">
            <h1 className="text-3xl font-semibold leading-tight">
              Welcome back to Ceylon Colorz!
            </h1>
            <p className="text-sm text-slate-100/90">
              Access your dashboard to manage orders, products and payouts. We
              keep your account and data protected.
            </p>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-slate-100">
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span>Use the same account for buyer and vendor features.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span>Encrypted passwords and secure sessions.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span>Need a vendor account? Apply in minutes.</span>
            </li>
          </ul>

          <div className="mt-auto pt-6 text-xs text-slate-100/80">
            By signing in you agree to our Terms of Service and Privacy Policy.
          </div>
        </section>

        {/* RIGHT PANEL / FORM */}
        <form
          onSubmit={onSubmit}
          className="relative w-full space-y-6 p-7 md:p-8 bg-white rounded-3xl shadow-xl border border-slate-100"
        >
          {/* Logo/Icon */}
          <div className="flex justify-center mb-1">
            <span className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-sky-100 shadow text-sky-700">
              <svg width={30} height={30} fill="none" viewBox="0 0 24 24">
                <circle
                  cx={12}
                  cy={12}
                  r={10}
                  fill="#0EA5E9"
                  opacity="0.12"
                />
                <path
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  d="M7 12l2.5 2.5L17 9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Sign in to Ceylon Colorz
            </h2>
            <p className="text-sm text-slate-500">
              Enter your email and password to continue.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 text-center">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Email address
            </label>
            <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-sky-200 focus-within:border-sky-400">
              <span className="pl-3">
                <svg
                  className="h-5 w-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x={3}
                    y={5}
                    width={18}
                    height={14}
                    rx={2}
                    stroke="currentColor"
                    strokeWidth={1.5}
                  />
                  <path
                    d="M4 7l8 6 8-6"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                className="w-full bg-transparent px-3 py-2.5 text-sm border-none outline-none rounded-xl"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-sky-200 focus-within:border-sky-400">
              <span className="pl-3">
                <svg
                  className="h-5 w-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x={5}
                    y={10}
                    width={14}
                    height={9}
                    rx={2}
                    stroke="currentColor"
                    strokeWidth={1.5}
                  />
                  <path
                    d="M9 10V8a3 3 0 016 0v2"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                className="w-full bg-transparent px-3 py-2.5 text-sm border-none outline-none"
                placeholder="Your password"
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="pr-3 text-xs text-slate-500 hover:text-slate-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                className="text-xs text-sky-600 hover:text-sky-700"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx={12}
                    cy={12}
                    r={10}
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>

          <div className="text-center text-sm pt-1 text-slate-600">
            <span>Don&apos;t have an account?</span>{" "}
            <Link
              href="/auth/signup"
              className="text-sky-600 font-medium hover:underline"
            >
              Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export const SignInPageWithSuspense = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <SignInPage />
  </Suspense>
);
