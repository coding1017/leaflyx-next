// lib/search-landings.server.ts

import { products as catalog } from "@/lib/products";
import type { SearchLandingConfig } from "@/lib/search-landings";

function norm(s: any) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

function readTagsLower(p: any): string[] {
  const out = new Set<string>();

  const cat = p?.category ? norm(p.category) : "";
  if (cat) out.add(cat);

  const subs = Array.isArray(p?.subcategories) ? p.subcategories : [];
  for (const t of subs) if (t) out.add(norm(t));

  const tags = Array.isArray(p?.tags) ? p.tags : [];
  for (const t of tags) if (t) out.add(norm(t));

  return Array.from(out);
}

/**
 * Parse % potency from strings like:
 *  "28% THCA"
 *  "26% THCA"
 * Returns null if not a percent potency.
 */
function potencyPercent(potency: any): number | null {
  const s = String(potency ?? "").toLowerCase();
  const m = s.match(/(\d+(\.\d+)?)\s*%/);
  if (!m) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : null;
}

/**
 * “Effective price” for filtering:
 * - if variants exist => lowest variant price (dollars)
 * - else => product.price (dollars)
 */
function effectiveMinPriceDollars(p: any): number {
  const variants = Array.isArray(p?.variants) ? p.variants : [];
  if (variants.length) {
    const nums = variants
      .map((v: any) => Number(v?.price))
      .filter((x: number) => Number.isFinite(x) && x > 0);
    if (nums.length) return Math.min(...nums);
  }
  const base = Number(p?.price);
  return Number.isFinite(base) ? base : 0;
}

export function filterCatalogForLanding(config: SearchLandingConfig) {
  const f = config.filters ?? {};
  const wantCategory = f.category ? norm(f.category) : null;
  const wantTags = Array.isArray(f.tags) ? f.tags.map(norm).filter(Boolean) : [];
  const wantCultivation = f.cultivation ? norm(f.cultivation) : null;

  const out = (catalog as any[]).filter((p) => {
    if (p?.active === false) return false;

    // category match
    if (wantCategory) {
      const cat = norm(p?.category);
      if (cat !== wantCategory) return false;
    }

    const tags = readTagsLower(p);

    // cultivation is effectively a required tag
    if (wantCultivation && !tags.includes(wantCultivation)) return false;

    // tags match (ALL) — tighter + safer for SEO intent pages
    if (wantTags.length) {
      const ok = wantTags.every((t) => tags.includes(t));
      if (!ok) return false;
    }

    // potency floor (percent only)
    if (typeof f.minPotencyPercent === "number") {
      const pct = potencyPercent(p?.potency);
      if (pct == null) return false;
      if (pct < f.minPotencyPercent) return false;
    }

    // max price
    if (typeof f.maxPrice === "number") {
      const price = effectiveMinPriceDollars(p);
      if (price > f.maxPrice) return false;
    }

    return true;
  });

  // Special rule: “lab tested” page = has COA link
  // (Only applied when title includes “Lab Tested” OR config has empty tags and description suggests COA)
  const isLabTestedPage =
    /lab\s*tested/i.test(config.title) || /co[aA]/.test(config.description);

  if (isLabTestedPage) {
    return out.filter((p) => !!p?.coaUrl);
  }

  return out;
}
