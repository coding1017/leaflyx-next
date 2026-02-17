// lib/catalog.server.ts
import { prisma } from "@/lib/prisma";
import { products as staticProducts } from "@/lib/products";

type AnyObj = Record<string, any>;

function lower(x: any) {
  return String(x ?? "").trim().toLowerCase();
}

function asStringArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return [];
}

function normalizeDbProduct(p: AnyObj) {
  const imageUrls = asStringArray(p.imageUrls);
  const imageUrl = p.imageUrl ? String(p.imageUrl) : imageUrls[0] ?? null;

  return {
    id: String(p.id),
    slug: String(p.slug),
    name: String(p.name),
    category: String(p.category),

    // Prisma Json fields return decoded
    subcategories: Array.isArray(p.subcategories) ? p.subcategories : [],
    tags: Array.isArray(p.tags) ? p.tags : [],

    price: typeof p.price === "number" ? p.price : null,
    potency: p.potency ? String(p.potency) : null,
    badge: p.badge ? String(p.badge) : null,
    coaUrl: p.coaUrl ? String(p.coaUrl) : null,
    active: !!p.active,

    // ✅ match your UI expectations
    image: imageUrl,
    images: imageUrls,

    variants: (p.variants ?? []).map((v: AnyObj) => ({
      id: String(v.id),
      label: v.label ? String(v.label) : String(v.id),
      grams: typeof v.grams === "number" ? v.grams : null,
      price: typeof v.price === "number" ? v.price : null,
      isPopular: !!v.isPopular,
    })),
  };
}

/**
 * ✅ Canonical: Static + DB merged
 * - DB wins if slug matches (primary)
 * - DB wins if id matches (fallback)
 * - DB active-only (recommended for storefront)
 */
export async function getMergedCatalogProducts() {
  const db = await prisma.catalogProduct.findMany({
    where: { active: true },
    include: { variants: true },
    orderBy: { updatedAt: "desc" },
  });

  const dbProducts = db.map(normalizeDbProduct);

  const bySlug = new Map<string, any>();
  const byId = new Map<string, any>();

  // seed static
  for (const p of staticProducts as any[]) {
    if (p?.slug) bySlug.set(lower(p.slug), p);
    if (p?.id) byId.set(lower(p.id), p);
  }

  // overlay db
  for (const p of dbProducts) {
    if (p?.slug) bySlug.set(lower(p.slug), p);
    if (p?.id) byId.set(lower(p.id), p);
  }

  const seen = new Set<string>();
  const out: any[] = [];

  for (const p of bySlug.values()) {
    out.push(p);
    if (p?.id) seen.add(lower(p.id));
    if (p?.slug) seen.add(lower(p.slug));
  }

  for (const p of byId.values()) {
    const key = p?.id ? lower(p.id) : "";
    if (key && !seen.has(key)) out.push(p);
  }

  out.sort((a, b) => lower(a?.name).localeCompare(lower(b?.name)));
  return out;
}

/** ✅ Find one by slug OR id (DB first). DB is active-only. */
export async function getMergedCatalogProductBySlugOrId(slugOrId: string) {
  const s = lower(slugOrId);
  if (!s) return null;

  const db = await prisma.catalogProduct.findFirst({
    where: { active: true, OR: [{ slug: s }, { id: s }] },
    include: { variants: true },
  });

  if (db) return normalizeDbProduct(db as any);

  const stat = (staticProducts as any[]).find((p) => lower(p?.slug) === s || lower(p?.id) === s);
  return stat ?? null;
}

/**
 * ✅ Back-compat for your existing APIs:
 * - app/api/catalog/route.ts
 * - app/api/admin/inventory/route.ts
 */
export async function getCatalogProducts() {
  return getMergedCatalogProducts();
}
