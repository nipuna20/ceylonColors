"use client";

import { useState } from "react";
import { createVendorAccount } from "./server-actions";

export default function VendorSignupPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="max-w-2xl rounded-xl border bg-white p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Become a Vendor</h1>
      <p className="text-gray-600">Fill in the details. We’ll review and approve your account.</p>

      <form
        className="grid gap-3"
        action={async (fd) => {
          setErr(null); setMsg(null);
          const res = await createVendorAccount(fd);
          if (res?.error) setErr(res.error);
          else setMsg("Submitted! We’ll email you once it’s approved.");
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Your Name</span>
            <input name="name" required className="rounded-xl border px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Email</span>
            <input name="email" type="email" required className="rounded-xl border px-3 py-2" />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-sm">Password</span>
          <input name="password" type="password" required className="rounded-xl border px-3 py-2" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Shop Name</span>
            <input name="shopName" required className="rounded-xl border px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Phone</span>
            <input name="phone" className="rounded-xl border px-3 py-2" />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-sm">Business Registration No (BRN)</span>
          <input name="brn" className="rounded-xl border px-3 py-2" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Address line 1</span>
            <input name="addressLine1" className="rounded-xl border px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">City</span>
            <input name="city" className="rounded-xl border px-3 py-2" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Bank name</span>
            <input name="bankName" className="rounded-xl border px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Account name</span>
            <input name="bankAccountName" className="rounded-xl border px-3 py-2" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Account number</span>
            <input name="bankAccountNo" className="rounded-xl border px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">SWIFT</span>
            <input name="bankSwift" className="rounded-xl border px-3 py-2" />
          </label>
        </div>

        <button className="mt-2 rounded-xl bg-blue-600 px-4 py-2 text-white">Submit</button>
      </form>

      {msg && <p className="text-green-700 text-sm">{msg}</p>}
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </div>
  );
}
