// lib/recommendations.ts
import { products } from "@/lib/products";

export type ProductLite = {
  id: string;
  slug: string;
  name: string;

  // for rendering cards
  image?: any; // string | StaticImageData (we’ll treat it loosely)
  price?: number; // base price
  variants?: { price?: number; isPopular?: boolean }[] | null;

  // existing scoring inputs
  category?: string | null;
  subcategories?: string[] | null;
  potency?: string | null;
};

function normalizeStr(v?: string | null) {
  return (v ?? "").trim().toLowerCase();
}

function toSet(arr?: string[] | null) {
  return new Set((arr ?? []).map((x) => normalizeStr(x)).filter(Boolean));
}

function parsePotencyPct(potency?: string | null): number | null {
  if (!potency) return null;
  const m = String(potency).match(/(\d+(\.\d+)?)\s*%/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function getProductLite(p: any): ProductLite {
  const variants = Array.isArray(p?.variants) ? p.variants : null;

  return {
    id: String(p.id),
    slug: String(p.slug),
    name: String(p.name ?? "Product"),

    image: p?.image ?? (Array.isArray(p?.images) ? p.images?.[0] : undefined),
    price: typeof p?.price === "number" ? p.price : Number(p?.price ?? 0),
    variants: variants
      ? variants.map((v: any) => ({
          price: typeof v?.price === "number" ? v.price : Number(v?.price ?? 0),
          isPopular: !!v?.isPopular,
        }))
      : null,

    category: p.category ?? null,
    subcategories: Array.isArray(p.subcategories) ? p.subcategories : null,
    potency: p.potency ?? null,
  };
}

/** ✅ display price for recommendation cards
 * - If variants exist: show the minimum variant price (“From $X”)
 * - Else: show base product.price
 */
export function getRecommendationDisplayPrice(p: ProductLite): { from: boolean; price: number } {
  const vs = p.variants ?? null;
  if (vs && vs.length) {
    const prices = vs
      .map((v) => Number(v?.price ?? NaN))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (prices.length) {
      return { from: true, price: Math.min(...prices) };
    }
  }

  const base = Number(p.price ?? NaN);
  return { from: false, price: Number.isFinite(base) && base > 0 ? base : 0 };
}

function scoreAlsoViewed(base: ProductLite, candidate: ProductLite) {
  let s = 0;

  const bc = normalizeStr(base.category);
  const cc = normalizeStr(candidate.category);

  if (bc && bc === cc) s += 10;

  const bs = toSet(base.subcategories);
  const cs = toSet(candidate.subcategories);
  let overlap = 0;
  bs.forEach((t) => {
    if (cs.has(t)) overlap += 1;
  });
  s += Math.min(overlap * 4, 8);

  const bp = parsePotencyPct(base.potency);
  const cp = parsePotencyPct(candidate.potency);
  if (bp !== null && cp !== null) {
    const diff = Math.abs(bp - cp);
    if (diff <= 1) s += 3;
    else if (diff <= 3) s += 2;
    else if (diff <= 6) s += 1;
  }

  return s;
}

function scorePairsWell(base: ProductLite, candidate: ProductLite) {
  const bc = normalizeStr(base.category);
  const cc = normalizeStr(candidate.category);

  let s = 0;

  const pairs: Record<string, string[]> = {
    flower: ["edibles", "beverages", "concentrates", "pre-rolls", "prerolls", "merch", "misc"],
    smalls: ["edibles", "beverages", "concentrates", "pre-rolls", "prerolls", "merch", "misc"],
    edibles: ["flower", "smalls", "beverages"],
    beverages: ["flower", "smalls", "edibles"],
    concentrates: ["flower", "smalls"],
    "pre-rolls": ["edibles", "beverages"],
    prerolls: ["edibles", "beverages"],
    merch: ["flower", "smalls", "edibles", "beverages"],
    misc: ["flower", "smalls", "edibles", "beverages"],
    vapes: ["flower", "edibles"],
  };

  const wants = pairs[bc] ?? [];
  if (wants.includes(cc)) s += 12;

  const bs = toSet(base.subcategories);
  const cs = toSet(candidate.subcategories);
  let overlap = 0;
  bs.forEach((t) => {
    if (cs.has(t)) overlap += 1;
  });
  s += Math.min(overlap * 2, 4);

  if (bc && bc === cc) s += 1;

  return s;
}

export function getRecommendations(productIdOrSlug: string, limit = 8) {
  const all = (products as any[]).map(getProductLite);

  const base =
    all.find((p) => p.id === productIdOrSlug) ||
    all.find((p) => p.slug === productIdOrSlug);

  if (!base) {
    return {
      alsoViewed: all.slice(0, limit),
      pairsWell: all.slice(0, limit),
    };
  }

  const pool = all.filter((p) => p.id !== base.id);

  const alsoViewed = pool
    .map((p) => ({ p, s: scoreAlsoViewed(base, p) }))
    .sort((a, b) => b.s - a.s)
    .filter((x) => x.s > 0)
    .slice(0, limit)
    .map((x) => x.p);

  const pairsWell = pool
    .map((p) => ({ p, s: scorePairsWell(base, p) }))
    .sort((a, b) => b.s - a.s)
    .filter((x) => x.s > 0)
    .slice(0, limit)
    .map((x) => x.p);

  const fallback = pool
    .map((p) => ({ p, s: scoreAlsoViewed(base, p) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);

  return {
    alsoViewed: alsoViewed.length ? alsoViewed : fallback,
    pairsWell: pairsWell.length ? pairsWell : fallback,
  };
}
