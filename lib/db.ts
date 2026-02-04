// lib/db.ts
import { products as legacy } from "@/lib/products";

// Unified product shape used by the app (prices in CENTS)
export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number; // cents
  image: string;
  images?: string[]; // optional multi-image support
  stock: number; // total units (sum of variants if present). 0 = sold out
  active: boolean;
  category: string; // "flower" | "vapes" | "edibles" | ...
  badge?: string; // marketing badge ("Bestseller", "Small Batch", ...)
  potency?: string; // optional human-readable potency (e.g., "26% THCA" or "25 mg")
  potencyValue?: number | null; // numeric potency extracted for sorting
  createdAt: string;
  updatedAt: string;
};

// In-memory cache (pretend DB)
let PRODUCTS: Product[] = [];

/* ----------------------------
   IMAGE NORMALIZATION (robust)
   ---------------------------- */

function isBadString(s?: string | null): boolean {
  if (!s) return true;
  const t = s.trim().toLowerCase();
  return (
    !t ||
    t.includes("[object object]") ||
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  );
}

function normalizePath(p?: string): string | undefined {
  if (!p || isBadString(p)) return undefined;
  if (p.startsWith("public/")) p = p.slice("public/".length);
  if (/^https?:\/\//i.test(p)) return p;
  if (!p.startsWith("/")) p = `/${p}`;
  return p;
}

// tiny guarded getter
const get = (obj: any, path: (string | number)[]) => {
  let cur = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[key as any];
  }
  return cur;
};

/** Try to extract a usable URL-like string from arbitrary shapes. */
function extractUrlDeep(input: any): string | undefined {
  if (input == null) return undefined;

  if (typeof input === "string") return normalizePath(input);

  if (Array.isArray(input)) {
    for (const item of input) {
      const v = extractUrlDeep(item);
      if (v) return v;
    }
    return undefined;
  }

  if (typeof input === "object") {
    // direct keys people often use
    const directKeys = ["src", "url", "image", "path", "href", "downloadUrl", "secure_url", "cdnUrl"];
    for (const k of directKeys) {
      const v = (input as any)[k];
      if (typeof v === "string") {
        const n = normalizePath(v);
        if (n) return n;
      }
    }

    // common CMS/file shapes
    const cmsPaths: (string | number)[][] = [
      // Strapi v4
      ["data", "attributes", "url"],
      // Strapi v3
      ["formats", "large", "url"],
      ["formats", "medium", "url"],
      ["formats", "small", "url"],
      ["url"],
      // Sanity
      ["asset", "url"],
      // Directus
      ["data", "full_url"],
      // generic wrappers
      ["file", "url"],
      ["file", "src"],
      ["image", "url"],
      ["image", "src"],
      // collections
      ["images", 0, "url"],
      ["images", 0, "src"],
      ["media", 0, "url"],
      ["media", 0, "src"],
      ["photos", 0, "url"],
      ["photos", 0, "src"],
      ["gallery", 0, "url"],
      ["gallery", 0, "src"],
      ["photo"],
      ["picture"],
    ];
    for (const path of cmsPaths) {
      const v = get(input, path);
      if (typeof v === "string") {
        const n = normalizePath(v);
        if (n) return n;
      }
    }

    // shallow scan as a last resort
    for (const v of Object.values(input)) {
      const n = extractUrlDeep(v);
      if (n) return n;
    }
  }

  return undefined;
}

function normalizeImage(input: any, fallback = "/images/placeholder.png"): string {
  const url = extractUrlDeep(input);
  return url ?? fallback;
}

function normalizeImagesArray(input: any): string[] | undefined {
  if (!input) return undefined;
  if (Array.isArray(input)) {
    const arr = input
      .map((x) => normalizeImage(x))
      .filter((s) => !!s && !isBadString(s)) as string[];
    return arr.length ? arr : undefined;
  }
  // single value that might represent multiple internally; still return single normalized
  const one = normalizeImage(input);
  return one ? [one] : undefined;
}

/* ----------------------------
   HELPERS (unchanged logic)
   ---------------------------- */

// Extract a numeric potency from strings like "26% THCA", "25 mg", "90%"
function parsePotency(input: any): number | null {
  if (!input) return null;
  const s = String(input);
  const m = s.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return null;
  const val = parseFloat(m[1]);
  if (isNaN(val)) return null;
  return val;
}

// Prefer variant price if present; fallback to product.price (DOLLARS → CENTS)
function priceFromProductOrVariants(p: any): number {
  // If there are variants, return the *lowest* variant price as the card price.
  if (Array.isArray(p?.variants) && p.variants.length) {
    const cents = p.variants
      .map((v: any) => Math.round(Number(v?.price ?? p?.price ?? 0) * 100))
      .filter((n: number) => Number.isFinite(n) && n >= 0);
    if (cents.length) return Math.min(...cents);
  }
  return Math.round(Number(p?.price ?? 0) * 100);
}

// Sum inventory across variants if present, else use product.stock
function stockFromVariants(p: any): number {
  if (Array.isArray(p?.variants) && p.variants.length) {
    const total = p.variants
      .map((v: any) => Number(v?.stock ?? 0))
      .reduce((a: number, b: number) => a + (Number.isFinite(b) ? b : 0), 0);
    return Math.max(0, total);
  }
  const top = Number(p?.stock ?? 0);
  return Number.isFinite(top) ? Math.max(0, top) : 0;
}

/* ----------------------------
   QUERIES
   ---------------------------- */

export function listProducts(): Product[] {
  if (PRODUCTS.length === 0) recomputeFromLegacy();
  return [...PRODUCTS];
}

export function getProductById(id: string): Product | undefined {
  if (PRODUCTS.length === 0) recomputeFromLegacy();
  return PRODUCTS.find((p) => p.id === id);
}

/* ----------------------------
   WRITES (prototype)
   ---------------------------- */

// Note: this decrements the product's TOTAL stock only (not per-variant).
export function decrementStock(items: { productId: string; quantity: number }[]): Product[] {
  // validate
  for (const { productId, quantity } of items) {
    const p = getProductById(productId);
    if (!p) throw new Error(`Product not found: ${productId}`);
    if (!p.active) throw new Error(`Product inactive: ${p.name}`);
    if (p.stock < quantity) throw new Error(`Not enough stock for ${p.name}`);
  }
  // apply
  for (const { productId, quantity } of items) {
    const p = getProductById(productId)!;
    p.stock = Math.max(0, p.stock - quantity);
    p.updatedAt = new Date().toISOString();
  }
  return listProducts();
}

/* ----------------------------
   RECOMPUTE FROM LEGACY
   ---------------------------- */

export function recomputeFromLegacy(): void {
  PRODUCTS = legacy.map((p: any, i: number) => {
    const slug = String(p?.slug ?? p?.id ?? `item_${i}`);
    const imageUrl = normalizeImage(
      // prefer explicit fields, but normalize any shape
      p?.image ?? p?.images ?? p?.media ?? p?.photos ?? p?.gallery ?? p?.picture
    );

    // If legacy has a collection of images, normalize them too
    const imagesNormalized =
      normalizeImagesArray(p?.images ?? p?.media ?? p?.photos ?? p?.gallery) ?? undefined;

    return {
      id: String(p?.id ?? `legacy_${i}`),
      slug,
      name: String(p?.name ?? `Product ${i + 1}`),
      price: priceFromProductOrVariants(p),
      image: imageUrl || "/images/placeholder.png", // ✅ ALWAYS a string
      images: imagesNormalized, // optional
      stock: stockFromVariants(p),
      active: Boolean(p?.active ?? true),
      category: String(
        p?.category ?? (Array.isArray(p?.categories) && p.categories[0]) ?? "misc"
      ).toLowerCase(),
      badge: p?.badge ?? undefined,
      potency: p?.potency ?? undefined,
      potencyValue: parsePotency(p?.potency),
      createdAt: PRODUCTS[i]?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}
