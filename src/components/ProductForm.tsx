"use client";

import { useState } from "react";

type Category = { id: string; name: string };

export default function ProductForm({
  initial,
  action,
  submitLabel,
  categories = [],
}: {
  initial?: {
    id?: string;
    title?: string;
    description?: string;
    price?: number;
    stock?: number;
    imageUrl?: string;
    categoryId?: string | null;
  };
  action: (state: any, formData: FormData) => Promise<any>;
  submitLabel: string;
  categories?: Category[]; // NEW
}) {
  const [state, setState] = useState<any>(null);

  return (
    <form
      action={async (fd: FormData) => setState(await action(null as any, fd))}
      className="grid gap-3 max-w-xl"
    >
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}

      <label className="grid gap-1">
        <span className="text-sm text-gray-700">Title</span>
        <input
          name="title"
          defaultValue={initial?.title}
          className="rounded-xl border px-3 py-2"
          required
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-gray-700">Description</span>
        <textarea
          name="description"
          defaultValue={initial?.description}
          className="rounded-xl border px-3 py-2"
        />
      </label>

      {/* NEW: Category select */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-700">Category</span>
        <select
          name="categoryId"
          defaultValue={initial?.categoryId ?? ""}
          className="rounded-xl border px-3 py-2"
        >
          <option value="">— None —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <span className="text-xs text-amber-600">
            No categories yet. An admin can add some at Dashboard → Admin → Categories.
          </span>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Price (LKR)</span>
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={initial?.price ?? 0}
            className="rounded-xl border px-3 py-2"
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Stock</span>
          <input
            name="stock"
            type="number"
            defaultValue={initial?.stock ?? 0}
            className="rounded-xl border px-3 py-2"
            required
          />
        </label>
      </div>

      <label className="grid gap-1">
        <span className="text-sm text-gray-700">Image URL</span>
        <input
          name="imageUrl"
          defaultValue={initial?.imageUrl}
          className="rounded-xl border px-3 py-2"
        />
      </label>

      <button className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        {submitLabel}
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">Saved.</p>}
    </form>
  );
}
