// lib/inventory.ts
import type { Product } from "./db";

// Tweak this to change the "Only N left" threshold across the site
export const LOW_STOCK_THRESHOLD = 3 as const;

// Sold-out check (also counts inactive as "sold out" for UI purposes)
export function isSoldOut(p: Product): boolean {
  return p.stock <= 0 || !p.active;
}

// Badge/label used on cards
export function lowStockLabel(p: Product): string | null {
  if (isSoldOut(p)) return "Sold Out";
  if (p.stock <= LOW_STOCK_THRESHOLD) return `Only ${p.stock} left`;
  return null;
}

// Simple sorter: available → sold out, then A→Z
export function sortAvailableFirst(products: Product[]) {
  return products.slice().sort((a, b) => {
    const aSold = isSoldOut(a) ? 1 : 0;
    const bSold = isSoldOut(b) ? 1 : 0;
    if (aSold !== bSold) return aSold - bSold;
    return a.name.localeCompare(b.name); // A→Z
  });
}

// Category-aware sorter
// Flower → Vapes → Edibles, then available → sold out, then A→Z
const CATEGORY_ORDER: Record<string, number> = {
  flower: 0,
  vapes: 1,
  edibles: 2,
};
const catKey = (c?: string) => (c ?? "").toLowerCase();

export function sortByCategoryAvailability(products: Product[]) {
  return products.slice().sort((a, b) => {
    const ca = CATEGORY_ORDER[catKey(a.category)] ?? 99;
    const cb = CATEGORY_ORDER[catKey(b.category)] ?? 99;
    if (ca !== cb) return ca - cb;

    const aSold = isSoldOut(a) ? 1 : 0;
    const bSold = isSoldOut(b) ? 1 : 0;
    if (aSold !== bSold) return aSold - bSold;

    return a.name.localeCompare(b.name);
  });
}
