// lib/inventory.server.ts
import { prisma } from "@/lib/prisma";

/**
 * Back-compat: returns Map(variantId -> qty) for ONE product.
 * NOTE: includes a special key "__∅__" for null-variant rows.
 */
export async function getInventoryMap(productId: string) {
  const rows = await withRetry(() =>
    prisma.inventory.findMany({
      where: { productId },
      select: { variant: true, qty: true },
    })
  );

  const map = new Map<string, number>();

  for (const r of rows) {
    // keep null variant too (important for non-variant products)
    const key = r.variant ? String(r.variant) : "__∅__";
    map.set(key, clampQty(r.qty));
  }

  return map;
}

/** Grid helper key: productId__variantOr∅ */
export function invKey(productId: string, variant: string | null) {
  return `${String(productId)}__${variant ?? "∅"}`;
}

function clampQty(n: any): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  // inventory should be integer >= 0
  return Math.max(0, Math.floor(v));
}

/* -------------------------
   DB reachability helpers
-------------------------- */

function isDbReachabilityError(e: any) {
  const msg = String(e?.message || "");
  return (
    e?.code === "P1001" ||
    msg.includes("Can't reach database server") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ENOTFOUND")
  );
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 250): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (retries > 0 && isDbReachabilityError(e)) {
      await sleep(delayMs);
      return withRetry(fn, retries - 1, delayMs);
    }
    throw e;
  }
}

/**
 * Fetch inventory for MANY products at once.
 * Returns Record<"productId__variantOr∅", qty>
 */
export async function getInventoryMapForProductIds(productIds: string[]) {
  const uniqueIds = Array.from(new Set(productIds.map((s) => String(s).trim()).filter(Boolean)));
  if (!uniqueIds.length) return {} as Record<string, number>;

  const rows = await withRetry(() =>
    prisma.inventory.findMany({
      where: { productId: { in: uniqueIds } },
      select: { productId: true, variant: true, qty: true },
    })
  );

  const out: Record<string, number> = {};

  for (const r of rows) {
    out[invKey(String(r.productId), r.variant ? String(r.variant) : null)] = clampQty(r.qty);
  }

  return out;
}

/**
 * Build (productId, variant) pairs from catalog products.
 * IMPORTANT: includes non-variant (null) pair, and variant ids (e.g. "1g", "3.5g")
 */
export function buildPairsFromCatalogProducts(products: any[]) {
  const pairs: Array<{ productId: string; variant: string | null }> = [];

  for (const p of products ?? []) {
    const productId = String(p?.id ?? "").trim();
    if (!productId) continue;

    const variants = Array.isArray(p?.variants) ? p.variants : [];

    if (!variants.length) {
      pairs.push({ productId, variant: null });
      continue;
    }

    for (const v of variants) {
      const vid = v?.id != null ? String(v.id).trim() : "";
      pairs.push({ productId, variant: vid || null });
    }
  }

  // dedupe pairs
  const seen = new Set<string>();
  return pairs.filter((x) => {
    const k = invKey(x.productId, x.variant);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Full “grid ready” map:
 * - defaults every catalog pair to its catalog stock:
 *    - non-variant product: p.stock
 *    - variant product: v.stock
 * - overlays DB values (DB wins)
 *
 * If DB is temporarily unreachable, we return catalog stock only (fail-open).
 */
export async function getInventoryOverlayForCatalogProducts(products: any[]) {
  const pairs = buildPairsFromCatalogProducts(products);
  const productIds = Array.from(new Set(pairs.map((p) => p.productId)));

  // Build catalog-stock lookup per invKey
  const catalogStock: Record<string, number> = {};

  for (const p of products ?? []) {
    const productId = String(p?.id ?? "").trim();
    if (!productId) continue;

    const variants = Array.isArray(p?.variants) ? p.variants : [];

    if (!variants.length) {
      // non-variant product uses product.stock
      catalogStock[invKey(productId, null)] = clampQty(p?.stock);
      continue;
    }

    for (const v of variants) {
      const vid = v?.id != null ? String(v.id).trim() : "";
      catalogStock[invKey(productId, vid || null)] = clampQty(v?.stock);
    }
  }

  // Default to catalog stock (NOT 0)
  const out: Record<string, number> = {};
  for (const p of pairs) {
    const k = invKey(p.productId, p.variant);
    out[k] = typeof catalogStock[k] === "number" ? catalogStock[k] : 0;
  }

  // Try overlay DB values (DB wins)
  if (!productIds.length) return out;

  try {
    const db = await getInventoryMapForProductIds(productIds);
    for (const k of Object.keys(db)) out[k] = db[k];
    return out;
  } catch (e: any) {
    // ✅ fail open: keep catalog stock so /shop doesn’t crash or show everything sold out
    if (isDbReachabilityError(e)) {
      console.error("[inventory.overlay] DB unreachable (using catalog stock only)", {
        code: e?.code,
        message: e?.message,
      });
      return out;
    }
    throw e;
  }
}
