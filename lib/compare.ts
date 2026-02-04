export type CompareItem = {
  id: string;
  slug: string;
  name: string;
  potency?: string | null; // "28% THCA"
  type?: string | null;    // "Indica/Hybrid/Sativa" (if you have it)
};

const KEY = "leaflyx_compare_v1";
const MAX = 3;

export function readCompare(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as CompareItem[]) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function writeCompare(items: CompareItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
}

export function toggleCompare(item: CompareItem): CompareItem[] {
  const items = readCompare();
  const exists = items.some((x) => x.id === item.id);
  const next = exists ? items.filter((x) => x.id !== item.id) : [item, ...items].slice(0, MAX);
  writeCompare(next);
  return next;
}

export function removeCompare(id: string) {
  const next = readCompare().filter((x) => x.id !== id);
  writeCompare(next);
  return next;
}

export function clearCompare() {
  writeCompare([]);
  return [];
}
