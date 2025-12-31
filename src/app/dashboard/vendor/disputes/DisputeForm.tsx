"use client";

import { useMemo, useState } from "react";

type PayoutRow = { id: string; status: string; amountLKR: string };

export default function DisputeForm({
  supportEmail,
  vendorShopName,
  payouts,
}: {
  supportEmail: string;
  vendorShopName: string;
  payouts: PayoutRow[];
}) {
  const [payoutId, setPayoutId] = useState(payouts[0]?.id ?? "");
  const [reason, setReason] = useState("");

  const mailtoHref = useMemo(() => {
    const subject = `Payout dispute #${payoutId}`;
    const body = `Vendor: ${vendorShopName}\nPayout ID: ${payoutId}\nReason:\n${reason}\n`;
    return `mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }, [supportEmail, vendorShopName, payoutId, reason]);

  return (
    <form
      className="rounded-2xl border bg-white p-5 grid gap-3 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = mailtoHref;
      }}
    >
      <label className="grid gap-1">
        <span className="text-sm text-gray-700">Payout</span>
        <select
          name="payoutId"
          value={payoutId}
          onChange={(e) => setPayoutId(e.target.value)}
          className="rounded-xl border px-3 py-2"
        >
          {payouts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id.slice(0, 8)} — {p.status} — LKR {p.amountLKR}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-gray-700">Reason / message</span>
        <textarea
          name="reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-xl border px-3 py-2"
          rows={4}
        />
      </label>

      <div className="flex items-center gap-2">
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-white">
          Email support
        </button>
        {/* Optional: visible mailto for right-click copy */}
        <a href={mailtoHref} className="text-sm text-gray-600 underline">
          or copy email
        </a>
      </div>

      <p className="text-xs text-gray-600">
        This opens your mail app with a prefilled message.
      </p>
    </form>
  );
}
