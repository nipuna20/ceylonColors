"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role: "BUYER" }),
    });
    setBusy(false);

    if (res.ok) {
      router.push("/auth/signin?welcome=1");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md space-y-6 p-8 bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-blue-100"
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.1)" }}
      >
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <span className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 shadow text-blue-700 text-3xl font-extrabold">
            <svg width={32} height={32} fill="none" viewBox="0 0 24 24">
              <circle cx={12} cy={12} r={10} fill="#2563EB" opacity="0.12"/>
              <path stroke="#2563EB" strokeWidth={2} d="M7 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        <div className="text-center space-y-1 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500">Sign up as a buyer</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 text-center transition">
            {error}
          </div>
        )}

        {/* Name Field */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Name</span>
          <div className="flex items-center mt-1 rounded-xl bg-gray-50 border focus-within:ring-2 focus-within:ring-blue-200">
            <span className="pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-transparent px-3 py-2 border-none outline-none focus:ring-0 rounded-xl"
            />
          </div>
        </label>

        {/* Email Field */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <div className="flex items-center mt-1 rounded-xl bg-gray-50 border focus-within:ring-2 focus-within:ring-blue-200">
            <span className="pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth={2} d="M4 4h16v16H4z" fill="none"/>
                <path stroke="currentColor" strokeWidth={2} d="M22 6L12 13 2 6"/>
              </svg>
            </span>
            <input
              type="email"
              required
              value={email}
              autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-transparent px-3 py-2 border-none outline-none focus:ring-0 rounded-xl"
            />
          </div>
        </label>

        {/* Password Field */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <div className="flex items-center mt-1 rounded-xl bg-gray-50 border focus-within:ring-2 focus-within:ring-blue-200">
            <span className="pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth={2} d="M12 17a2 2 0 002-2v-1a2 2 0 10-4 0v1a2 2 0 002 2z"/>
                <path stroke="currentColor" strokeWidth={2} d="M17 8V7a5 5 0 00-10 0v1"/>
                <rect x={5} y={8} width={14} height={10} rx={2} />
              </svg>
            </span>
            <input
              type="password"
              required
              value={password}
              autoComplete="new-password"
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent px-3 py-2 border-none outline-none focus:ring-0 rounded-xl"
            />
          </div>
          <span className="text-xs text-gray-400 ml-2">Min 6 characters</span>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:brightness-110 transition disabled:opacity-50"
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Creating...
            </span>
          ) : "Sign Up"}
        </button>

        {/* Links */}
        <div className="text-sm text-center space-y-2 pt-2">
          <p>
            Already have an account?{" "}
            <a href="/auth/signin" className="text-blue-600 underline hover:text-blue-800 transition">
              Sign in
            </a>
          </p>
          <div className="pt-2 border-t text-gray-500">
            <p className="mb-2">Want to sell on Malpra?</p>
            <a
              href="/auth/signup/vendor"
              className="inline-block rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium hover:bg-blue-100 transition"
            >
              Apply as a vendor
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
