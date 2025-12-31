// src/app/dashboard/buyer/profile/BuyerAvatarUploader.tsx
"use client";

import { useState } from "react";

export default function BuyerAvatarUploader({
  initialUrl,
}: {
  initialUrl?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setBusy(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file); // 👈 must be "avatar"

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
        // ❌ do NOT set Content-Type manually
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setPreview(data.url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not upload image. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600 overflow-hidden">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span>N</span>
          )}
        </div>
        <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-white border shadow p-1 text-xs">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          ✏️
        </label>
      </div>

      {busy && (
        <p className="text-xs text-slate-500">Uploading photo…</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
