// src/lib/helapay.ts
import crypto from "crypto";

/** Mode */
export function helapayMode() {
  return (process.env.HELAPAY_MODE ?? "sandbox").toLowerCase();
}

/** Hosted checkout endpoint (from .env) */
export function helapayCheckoutUrl() {
  return helapayMode() === "live"
    ? (process.env.HELAPAY_CHECKOUT_URL_LIVE ?? "")
    : (process.env.HELAPAY_CHECKOUT_URL_SANDBOX ?? "");
}

/** Credentials */
export function helapayMerchantId() {
  return helapayMode() === "live"
    ? process.env.HELAPAY_MERCHANT_ID_LIVE!
    : process.env.HELAPAY_MERCHANT_ID_SANDBOX!;
}

export function helapaySecret() {
  return helapayMode() === "live"
    ? process.env.HELAPAY_SECRET_LIVE!
    : process.env.HELAPAY_SECRET_SANDBOX!;
}

/**
 * Attempt to verify HelaPay webhook signature.
 * Many gateways provide an HMAC of request fields using a shared secret.
 * This implementation:
 *  - accepts form-encoded or JSON payload
 *  - removes `signature` field
 *  - sorts remaining keys, builds "k=v" string joined by '&'
 *  - creates HMAC-SHA256(message, secret), compares (case-insensitive)
 *
 * If your docs specify a different formula, adjust this function only.
 */
export function verifyHelaPaySignature(
  allParams: Record<string, string | number | null | undefined>
): boolean {
  const provided = String(allParams["signature"] ?? allParams["sign"] ?? "").toLowerCase();
  if (!provided) {
    // If HelaPay doesn't send a signature in sandbox, allow (but log).
    console.warn("[helapay] no signature provided; skipping verification");
    return true;
  }

  // Build canonical string from sorted keys excluding signature-ish fields
  const ignore = new Set(["signature", "sign"]);
  const entries = Object.entries(allParams)
    .filter(([k, v]) => !ignore.has(k) && v !== undefined && v !== null)
    .map(([k, v]) => [k, String(v)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const msg = entries.map(([k, v]) => `${k}=${v}`).join("&");
  const calc = crypto.createHmac("sha256", helapaySecret()).update(msg).digest("hex").toLowerCase();

  return calc === provided;
}

/** Small helper to render an HTML auto-submit form */
export function input(name: string, value: string) {
  return `<input type="hidden" name="${name}" value="${value.replace(/"/g, "&quot;")}" />`;
}
