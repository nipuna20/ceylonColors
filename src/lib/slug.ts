// src/lib/slug.ts
export function slugifyLocal(
    input: string,
    // accept options so call sites like slugify(str, { lower: true, strict: true }) are valid
    _opts?: { lower?: boolean; strict?: boolean }
  ) {
    return input
      .toLowerCase()
      .trim()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")   // strip accents
      .replace(/[^a-z0-9\s-]/g, "")      // remove non-word chars
      .replace(/\s+/g, "-")              // spaces -> dashes
      .replace(/-+/g, "-")               // collapse consecutive dashes
      .replace(/^-|-$/g, "");            // trim leading/trailing dashes
  }
  