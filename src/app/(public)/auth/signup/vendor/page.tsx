"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function VendorSignUpPage() {
  const router = useRouter();

  // user fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // vendor fields (basic KYC/payout)
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [taxId, setTaxId] = useState("");
  const [brn, setBrn] = useState("");
  const [website, setWebsite] = useState("");

  // bank info
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankSwift, setBankSwift] = useState("");

  // image URLs (Firebase)
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [nicFrontUrl, setNicFrontUrl] = useState<string | null>(null);
  const [nicBackUrl, setNicBackUrl] = useState<string | null>(null);

  // uploading flags
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingNicFront, setUploadingNicFront] = useState(false);
  const [uploadingNicBack, setUploadingNicBack] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function uploadFile(prefix: string, file: File): Promise<string> {
    const filePath = `${prefix}/${Date.now()}-${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  }

  // === handlers for image inputs (upload + preview) ===
  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingLogo(true);
    try {
      const url = await uploadFile("vendors/logos", file);
      setLogoUrl(url);
    } catch (err) {
      console.error(err);
      setError("Failed to upload shop logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleNicFrontChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingNicFront(true);
    try {
      const url = await uploadFile("vendors/nic-front", file);
      setNicFrontUrl(url);
    } catch (err) {
      console.error(err);
      setError("Failed to upload NIC front image.");
    } finally {
      setUploadingNicFront(false);
    }
  }

  async function handleNicBackChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingNicBack(true);
    try {
      const url = await uploadFile("vendors/nic-back", file);
      setNicBackUrl(url);
    } catch (err) {
      console.error(err);
      setError("Failed to upload NIC back image.");
    } finally {
      setUploadingNicBack(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (uploadingLogo || uploadingNicFront || uploadingNicBack) {
      setError("Please wait until all images finish uploading.");
      return;
    }

    setBusy(true);

    try {
      const payload = {
        role: "VENDOR" as const,
        email,
        password,
        name,
        vendor: {
          shopName,
          phone,
          addressLine1,
          addressLine2,
          city,
          taxId,
          brn,
          website,
          payoutMethod: "BANK" as const,
          bankName,
          bankBranch,
          bankAccountName,
          bankAccountNo,
          bankSwift,
          logoUrl,
          nicFrontUrl,
          nicBackUrl,
        },
      };

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/auth/signin?applied=vendor");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to create account.");
    } finally {
      setBusy(false);
    }
  }

  const anyUploading = uploadingLogo || uploadingNicFront || uploadingNicBack;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)] items-start">
        {/* Left panel: marketing / explanation */}
        <section className="hidden lg:flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-sky-600 via-indigo-600 to-purple-600 text-white p-8 shadow-lg">
          <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium w-fit">
            New vendor onboarding
          </div>
          <h1 className="text-3xl font-semibold leading-tight">
            Start selling on Ceylon Colorz in a few minutes.
          </h1>
          <p className="text-sm text-slate-100/90">
            Tell us about your shop, upload your NIC for verification, and add
            your payout details. Our team will review and approve your vendor
            account as quickly as possible.
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span>Secure document upload powered by Firebase Storage.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span>Only verified vendors can list products.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span>Fast approval for complete applications.</span>
            </li>
          </ul>
          <div className="mt-auto text-xs text-slate-100/80">
            By applying, you agree to our Vendor Terms and KYC policy.
          </div>
        </section>

        {/* Right panel: actual form */}
        <form
          onSubmit={onSubmit}
          className="w-full bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-7 border border-slate-100"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Vendor application</h2>
              <p className="text-xs text-slate-500 mt-1">
                Please complete all sections so we can verify your account.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
              Step 1 of 1
            </span>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* 1. Account details */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Account details
                </h3>
                <p className="text-xs text-slate-500">
                  These credentials are for logging into your vendor dashboard.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">Your name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nipun Perera"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  required
                  placeholder="name@shop.com"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs md:col-span-2">
                <span className="font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 2. Shop details + logo */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Shop details
                </h3>
                <p className="text-xs text-slate-500">
                  Information that will appear on your public vendor profile.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4">
              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">Shop name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blooming Flowers"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                />
              </label>

              <div className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">
                  Shop logo (optional)
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-100">
                    <span>Select image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                  {uploadingLogo && (
                    <span className="text-[11px] text-slate-500">
                      Uploading…
                    </span>
                  )}
                </div>
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Shop logo preview"
                    className="mt-2 h-14 w-14 rounded-md object-cover border border-slate-200"
                  />
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">Phone</span>
                <input
                  type="tel"
                  placeholder="Contact number for orders"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">City</span>
                <input
                  type="text"
                  placeholder="e.g. Colombo"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs md:col-span-2">
                <span className="font-medium text-slate-700">
                  Address line 1
                </span>
                <input
                  type="text"
                  placeholder="Street and number"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs md:col-span-2">
                <span className="font-medium text-slate-700">
                  Address line 2 (optional)
                </span>
                <input
                  type="text"
                  placeholder="Apartment, floor, etc."
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">Tax ID</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">BRN</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={brn}
                  onChange={(e) => setBrn(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs md:col-span-2">
                <span className="font-medium text-slate-700">
                  Website (optional)
                </span>
                <input
                  type="url"
                  placeholder="https://yourshop.com"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 3. Identity verification */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Identity verification (NIC)
                </h3>
                <p className="text-xs text-slate-500">
                  We use your NIC only for KYC checks. Images are stored
                  securely.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">
                  NIC front image
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-100">
                    <span>Upload front</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleNicFrontChange}
                    />
                  </label>
                  {uploadingNicFront && (
                    <span className="text-[11px] text-slate-500">
                      Uploading…
                    </span>
                  )}
                </div>
                {nicFrontUrl && (
                  <img
                    src={nicFrontUrl}
                    alt="NIC front preview"
                    className="mt-2 h-24 w-full rounded-md object-cover border border-slate-200"
                  />
                )}
              </div>

              <div className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">
                  NIC back image
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-100">
                    <span>Upload back</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleNicBackChange}
                    />
                  </label>
                  {uploadingNicBack && (
                    <span className="text-[11px] text-slate-500">
                      Uploading…
                    </span>
                  )}
                </div>
                {nicBackUrl && (
                  <img
                    src={nicBackUrl}
                    alt="NIC back preview"
                    className="mt-2 h-24 w-full rounded-md object-cover border border-slate-200"
                  />
                )}
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 4. Bank / payout details */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Payout details
                </h3>
                <p className="text-xs text-slate-500">
                  We&apos;ll send your payouts to this bank account. Double-check
                  for typos.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">Bank name</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">Branch</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">Account name</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span className="font-medium text-slate-700">
                  Account number
                </span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                />
              </label>

              <label className="grid gap-1 text-xs md:col-span-2">
                <span className="font-medium text-slate-700">SWIFT</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                  value={bankSwift}
                  onChange={(e) => setBankSwift(e.target.value)}
                />
              </label>
            </div>
          </section>

          <div className="space-y-3 pt-1">
            <button
              type="submit"
              disabled={busy || anyUploading}
              className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {anyUploading
                ? "Waiting for images…"
                : busy
                ? "Submitting…"
                : "Submit application"}
            </button>

            <p className="text-xs text-center text-slate-500">
              Already have an account?{" "}
              <a
                href="/auth/signin"
                className="font-medium text-sky-600 hover:underline"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
