// components/ProductGrid.tsx
"use client";

import Link from "next/link";
import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AddToCartButton } from "./AddToCartButton";
import { listProducts, type Product } from "@/lib/db";
import * as ProductMeta from "@/lib/products";
import ReviewBadge from "@/components/reviews/ReviewBadge";
import CoaVerifiedPill from "@/components/CoaVerifiedPill";
import ShopCompareToggle from "@/components/compare/ShopCompareToggle";
import ComparePill from "@/components/compare/ComparePill";

/** Category order (case-insensitive) */
const CATEGORY_ORDER = [
  "flower",
  "smalls",
  "edibles",
  "vapes",
  "beverages",
  "pre-rolls",
  "concentrates",
  "merch",
  "misc",
];

type ProductGridProps = {
  limit?: number;
  category?: string;

  /** legacy */
  items?: Product[];

  showSort?: boolean;
  includeTags?: string[];

  /** ✅ NEW: pass catalog products directly (lib/products.ts) */
  products?: any[];

  /** ✅ NEW: inventory overlay from getInventoryOverlayForCatalogProducts() */
  inventoryMap?: Record<string, number>;
};

type VariantLike = { id?: string | number; label?: string; priceCents?: number; price?: number };
type MatchMode = "all" | "any";
type SortKey = "alpha" | "price" | "potency" | "rating";

const usd = (cents: number) =>
  ((cents ?? 0) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

/* -----------------------------------
   INVENTORY OVERLAY HELPERS (client)
------------------------------------ */

/** Must match lib/inventory.server.ts */
function invKey(productId: string, variant: string | null) {
  return `${productId}__${variant ?? "∅"}`;
}

function getQtyFromMap(
  inventoryMap: Record<string, number> | undefined,
  productId: string,
  variant: string | null
) {
  if (!inventoryMap) return undefined;
  const k = invKey(productId, variant);
  const v = inventoryMap[k];
  return typeof v === "number" ? v : undefined;
}

function variantIdFromCatalogVariant(v: any): string | null {
  // Your server overlay uses v.id as the variant key.
  const raw = v?.id != null ? String(v.id).trim() : "";
  return raw || null;
}

function computeProductQtyInfo(p: any, inventoryMap?: Record<string, number>) {
  const productId = String(p?.id ?? "").trim();
  const variants = Array.isArray(p?.variants) ? p.variants : [];

  // If we don't have an overlay, return "unknown" and let legacy behavior run.
  if (!inventoryMap || !productId) {
    return {
      soldOut: false,
      lowBadge: null as string | null,
      minQty: null as number | null,
      hasOverlay: false,
    };
  }

  // Non-variant product -> use null variant row
  if (!variants.length) {
    const q = getQtyFromMap(inventoryMap, productId, null);
    const qty = typeof q === "number" ? q : 0;
    const soldOut = qty <= 0;
    const lowBadge = !soldOut && qty <= 2 ? (qty === 1 ? "Only 1 left" : `Only ${qty} left`) : null;
    return { soldOut, lowBadge, minQty: qty, hasOverlay: true };
  }

  // Variant product -> sold out if ALL variants are 0
  const qtys = variants.map((v: any) => {
    const vid = variantIdFromCatalogVariant(v);
    const q = getQtyFromMap(inventoryMap, productId, vid);
    return typeof q === "number" ? q : 0;
  });

  const maxQty = Math.max(...qtys);
  const minNonZero = Math.min(...qtys.filter((x: number) => x > 0), Infinity);
  const soldOut = maxQty <= 0;

  // Low-stock badge based on the lowest available qty (premium feel)
  let lowBadge: string | null = null;
  if (!soldOut && Number.isFinite(minNonZero)) {
    if (minNonZero <= 2) lowBadge = minNonZero === 1 ? "Only 1 left" : `Only ${minNonZero} left`;
  }

  return { soldOut, lowBadge, minQty: soldOut ? 0 : minNonZero, hasOverlay: true };
}

/* -----------------------------------
   IMAGE NORMALIZATION HELPERS
------------------------------------ */

function isBadString(s?: string | null): boolean {
  if (!s) return true;
  const trimmed = s.trim();
  if (!trimmed) return true;

  const t = trimmed.toLowerCase();
  if (t.includes("[object object]")) return true;

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  )
    return true;

  return false;
}

function normalizePath(p?: string): string | undefined {
  if (!p || isBadString(p)) return undefined;

  if (p.startsWith("public/")) p = p.slice("public/".length);

  if (/^https?:\/\//i.test(p)) return p;

  if (!p.startsWith("/")) p = `/${p}`;

  return p;
}

const get = (obj: any, path: (string | number)[]): any => {
  let cur = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[key as any];
  }
  return cur;
};

function extractUrlDeep(input: any, depth = 0, maxDepth = 6): string | undefined {
  if (input == null || depth > maxDepth) return undefined;

  if (typeof input === "string") return normalizePath(input);

  if (Array.isArray(input)) {
    for (const item of input) {
      const found = extractUrlDeep(item, depth + 1, maxDepth);
      if (found) return found;
    }
    return undefined;
  }

  if (typeof input === "object") {
    const directKeys = ["src", "url", "image", "path", "href", "downloadUrl", "secure_url", "cdnUrl"];
    for (const k of directKeys) {
      const v = (input as any)[k];
      if (typeof v === "string") {
        const n = normalizePath(v);
        if (n) return n;
      }
    }

    const cmsPaths: (string | number)[][] = [
      ["data", "attributes", "url"],
      ["formats", "large", "url"],
      ["formats", "medium", "url"],
      ["formats", "small", "url"],
      ["url"],
      ["asset", "url"],
      ["data", "full_url"],
      ["file", "url"],
      ["file", "src"],
      ["image", "url"],
      ["image", "src"],
      ["images", 0, "url"],
      ["images", 0, "src"],
      ["media", 0, "url"],
      ["media", 0, "src"],
      ["photo"],
      ["picture"],
      ["gallery", 0, "url"],
      ["gallery", 0, "src"],
    ];
    for (const path of cmsPaths) {
      const v = get(input, path);
      if (typeof v === "string") {
        const n = normalizePath(v);
        if (n) return n;
      }
    }

    for (const v of Object.values(input)) {
      const found = extractUrlDeep(v, depth + 1, maxDepth);
      if (found) return found;
    }
  }

  return undefined;
}

function toImageSrcDeep(input: any, fallback = "/images/placeholder.png"): string {
  const found = extractUrlDeep(input);
  return found ?? fallback;
}

function primaryImgFor(p: any): string {
  const slug = String(p?.slug ?? "");
  const metaBySlug = (ProductMeta as any)?.PRODUCTS_BY_SLUG?.[slug] ?? (ProductMeta as any)?.[slug];

  const candidates = [
    p?.image,
    p?.images,
    p?.media,
    p?.photos,
    p?.gallery,
    p?.picture,
    metaBySlug?.image,
    metaBySlug?.images,
    metaBySlug?.media,
    metaBySlug?.photos,
    metaBySlug?.gallery,
    metaBySlug?.picture,
    metaBySlug?.photo,
    metaBySlug?.url,
  ];

  for (const c of candidates) {
    const src = toImageSrcDeep(c);
    if (src && !isBadString(src) && src !== "/images/placeholder.png") return src;
  }

  return "/images/placeholder.png";
}

/* -----------------------------------
   COA LINK HELPER
------------------------------------ */

function coaUrlFor(p: any): string | null {
  const direct =
    p?.coaUrl ??
    p?.coa ??
    p?.coa_href ??
    p?.coaLink ??
    null;

  if (direct) return String(direct);

  const slug = String(p?.slug ?? "").trim().toLowerCase();
  const id = String(p?.id ?? "").trim().toLowerCase();
  const name = String(p?.name ?? "").trim().toLowerCase();

  const meta: any = ProductMeta;

  const pick = (rec: any): string | null => {
    if (!rec || typeof rec !== "object") return null;
    const u = rec.coaUrl ?? rec.coa ?? rec.coaHref ?? rec.coaLink ?? null;
    return u ? String(u) : null;
  };

  const bySlug = meta?.PRODUCTS_BY_SLUG?.[slug];
  if (bySlug) {
    const u = pick(bySlug);
    if (u) return u;
  }

  const byId = meta?.PRODUCTS_BY_ID?.[id];
  if (byId) {
    const u = pick(byId);
    if (u) return u;
  }

  const tryArray = (arr: any[]): string | null => {
    if (!Array.isArray(arr)) return null;
    const hit =
      arr.find((x: any) => String(x?.slug ?? "").toLowerCase() === slug) ||
      arr.find((x: any) => String(x?.id ?? "").toLowerCase() === id) ||
      arr.find((x: any) => String(x?.name ?? "").toLowerCase() === name);

    return hit ? pick(hit) : null;
  };

  const candidates = [meta.PRODUCTS, meta.catalog, meta.CATALOG, meta.default, meta.products];
  for (const c of candidates) {
    const u = Array.isArray(c) ? tryArray(c) : null;
    if (u) return u;
  }

  return null;
}

/* -----------------------------------
   VARIANT + RATING HELPERS
------------------------------------ */

function toCents(v: VariantLike): number {
  if (typeof v?.priceCents === "number") return Math.round(v.priceCents);
  if (typeof v?.price === "number") return Math.round(v.price >= 1000 ? v.price : v.price * 100);
  return 0;
}

function ratingOf(p: any): number {
  const raw = p?.ratingAvg ?? p?.rating ?? p?.stars ?? p?.reviews?.avg ?? 0;
  const v = Number(raw);
  return Number.isFinite(v) ? v : 0;
}

function findVariantsFor(p: any): { id: string | null; label: string; priceCents: number }[] | undefined {
  const variants = Array.isArray(p?.variants) ? p.variants : null;
  if (variants?.length) {
    return variants.map((v: any) => ({
      id: v?.id != null ? String(v.id).trim() : null,
      label: String(v?.label ?? ""),
      priceCents: toCents(v),
    }));
  }
  return undefined;
}

/* -----------------------------------
   BG IMAGE
------------------------------------ */

function BgImage({ src, alt }: { src: string; alt: string }) {
  const [bg, setBg] = useState<string>("/images/placeholder.png");

  useEffect(() => {
    let cancelled = false;
    if (!src || src === bg) return;

    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setBg(src);
    };
    img.onerror = () => {
      if (!cancelled) setBg("/images/placeholder.png");
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, bg]);

  return (
    <div
      role="img"
      aria-label={alt}
      className="w-full aspect-square"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundColor: "rgba(0,0,0,0.02)",
      }}
    />
  );
}

/* -----------------------------------
   TAG HELPERS
------------------------------------ */

function readSubcategories(p: any): string[] {
  const tags: string[] = Array.isArray(p?.subcategories) ? p.subcategories : [];
  if (tags.length) return tags.map((t) => String(t).toLowerCase());

  return [];
}

function readAllTagsLower(p: any): string[] {
  const out = new Set<string>();

  const cat = p?.category ? String(p.category).toLowerCase() : "";
  if (cat) out.add(cat);

  for (const t of readSubcategories(p)) out.add(String(t).toLowerCase());

  const tags = Array.isArray(p?.tags) ? p.tags : [];
  for (const t of tags) if (t) out.add(String(t).toLowerCase());

  return Array.from(out);
}

/* -----------------------------------
   QUICK-FACTS (TAGS ONLY)
------------------------------------ */

function prettyTag(t: string) {
  return t
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-/g, " ")
    .replace(/\bthca\b/i, "THCA")
    .replace(/\bno till\b/i, "no-till")
    .replace(/\blive resin\b/i, "live resin")
    .replace(/\blive rosin\b/i, "live rosin")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function getQuickTags(p: any): string[] {
  const hay = readAllTagsLower(p);
  const cat = p?.category ? String(p.category).toLowerCase() : "";
  const tags = hay.filter((t) => t && t !== cat);

  const preferred = [
    "indoor",
    "outdoor",
    "greenhouse",
    "exotic",
    "small-batch",
    "organic",
    "no-till",
    "live-resin",
    "live-rosin",
    "bestseller",
  ];

  const sorted = [...new Set(tags)].sort((a, b) => {
    const ai = preferred.indexOf(a);
    const bi = preferred.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return sorted.slice(0, 2);
}

function QuickFacts({ p }: { p: any }) {
  const tags = getQuickTags(p).map(prettyTag);
  if (!tags.length) return null;

  return (
    <div
      className="
        mt-1 flex flex-wrap items-center gap-x-2 gap-y-1
        text-[11px] tracking-wide
        text-[rgba(212,175,55,0.72)]
      "
    >
      {tags.map((txt, i) => (
        <span key={`${txt}-${i}`} className="inline-flex items-center">
          {i > 0 ? <span className="mx-2 text-[rgba(212,175,55,0.30)]">•</span> : null}
          <span className="truncate">{txt}</span>
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------
   FancySelect — custom gold dropdown
-------------------------------------------- */

function FancySelect({
  value,
  onChange,
  options,
  className = "",
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((o) => o.value === value))
  );
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !btnRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value);
    if (idx >= 0) setActiveIndex(idx);
  }, [value, options]);

  function commit(idx: number) {
    const opt = options[idx];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(activeIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {label ? (
        <span className="text-sm opacity-80">
          <span className="bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent">
            {label}
          </span>
        </span>
      ) : null}

      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={[
          "relative rounded-2xl px-3 py-1.5 pr-9 text-sm font-medium transition border",
          "bg-black/70 border-[rgba(212,175,55,0.4)]",
          "hover:bg-black/80 hover:border-[var(--brand-gold)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/70",
          "hover:shadow-[0_0_12px_#facc15]",
        ].join(" ")}
      >
        <span className="bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent">
          {selected?.label}
        </span>

        <svg
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-transform duration-200 ${
            open ? "rotate-180 text-[var(--brand-gold)]" : "text-[#d4af37]/80"
          }`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="listbox"
          tabIndex={-1}
          className="
            absolute z-50 mt-2 min-w-[220px] right-0
            rounded-2xl p-1
            backdrop-blur-md
            bg-[rgba(25,25,25,0.85)]
            border border-[rgba(212,175,55,0.35)]
            shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_8px_rgba(255,255,255,0.05)]
          "
          onKeyDown={onKeyDown}
        >
          {options.map((opt, idx) => {
            const isActive = idx === activeIndex;
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={[
                  "px-3 py-2 rounded-xl cursor-pointer select-none text-sm",
                  isActive ? "bg-[rgba(212,175,55,0.18)]" : "bg-transparent",
                  isSelected ? "outline outline-1 outline-[rgba(212,175,55,0.5)]" : "",
                  "hover:bg-[rgba(212,175,55,0.22)]",
                ].join(" ")}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => commit(idx)}
              >
                <span className="bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent">
                  {opt.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -----------------------------------
   MAIN GRID
------------------------------------ */

export function ProductGrid({
  limit,
  category,
  items,
  showSort = true,
  includeTags = [],
  products,
  inventoryMap,
}: ProductGridProps) {
  const searchParams = useSearchParams();

  const [sortKey, setSortKey] = useState<SortKey>("alpha");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [filters, setFilters] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<MatchMode>("all");

  const scope = useMemo(() => {
    const base =
      (category && category.trim()) ||
      (Array.isArray(includeTags) && includeTags.length ? includeTags.join("-") : "") ||
      "all";
    return base.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  }, [category, includeTags]);

  const didInitFromUrl = useRef(false);
  useEffect(() => {
    if (didInitFromUrl.current) return;
    didInitFromUrl.current = true;

    const key = `filters_${scope}`;
    const multi = searchParams
      .getAll(key)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const legacyRaw = searchParams.get(key);
    const legacy = legacyRaw
      ? legacyRaw
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const fromUrl = multi.length ? multi : legacy;

    const matchKey = `match_${scope}`;
    const urlMatch = (searchParams.get(matchKey) === "any" ? "any" : "all") as MatchMode;

    if (fromUrl.length) setFilters(fromUrl);
    setMatchMode(urlMatch);
  }, [searchParams, scope]);

  // ✅ priority: products (catalog) → items → listProducts()
  let base: any[] =
    Array.isArray(products) ? products.slice() :
    Array.isArray(items) ? items.slice() :
    listProducts();

  if (!products && !items && category) {
    const target = category.toLowerCase();
    base = base.filter((p) => String(p.category ?? "").toLowerCase() === target);
  }

  if (Array.isArray(includeTags) && includeTags.length) {
    const needles = includeTags.map((t) => t.toLowerCase());
    base = base.filter((p) => {
      const hay = readAllTagsLower(p);
      return needles.some((n) => hay.includes(n));
    });
  }

  const subcategoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of base) for (const t of readSubcategories(p)) if (t) set.add(t);
    return Array.from(set).sort();
  }, [base]);

  const filteredBase = useMemo(() => {
    if (!filters.length) return base;

    if (matchMode === "any") {
      return base.filter((p) => {
        const tags = readSubcategories(p);
        return filters.some((f) => tags.includes(f));
      });
    }

    return base.filter((p) => {
      const tags = readSubcategories(p);
      return filters.every((f) => tags.includes(f));
    });
  }, [base, filters, matchMode]);

  function compareWithin(a: any, b: any): number {
    const dir = sortOrder === "asc" ? 1 : -1;
    let cmp = 0;

    if (sortKey === "alpha") cmp = String(a.name ?? "").localeCompare(String(b.name ?? ""));
    else if (sortKey === "price") cmp = (a.price ?? 0) - (b.price ?? 0);
    else if (sortKey === "potency") {
      const av = (a as any).potencyValue ?? null;
      const bv = (b as any).potencyValue ?? null;
      if (av == null && bv == null) cmp = 0;
      else if (av == null) cmp = 1;
      else if (bv == null) cmp = -1;
      else cmp = av - bv;
    } else if (sortKey === "rating") cmp = ratingOf(a) - ratingOf(b);

    if (cmp !== 0) return cmp * dir;

    // ✅ tie-breaker: sold out last (when overlay exists)
    const aInfo = computeProductQtyInfo(a, inventoryMap);
    const bInfo = computeProductQtyInfo(b, inventoryMap);
    if (aInfo.hasOverlay && bInfo.hasOverlay && aInfo.soldOut !== bInfo.soldOut) {
      return aInfo.soldOut ? 1 : -1;
    }

    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  }

  const groupedSorted = useMemo(() => {
    const byCat = new Map<string, any[]>();
    for (const p of filteredBase) {
      const key = String(p.category ?? "misc").toLowerCase();
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(p);
    }

    const out: any[] = [];
    const sortedGroup = (cat: string) => [...(byCat.get(cat) ?? [])].sort(compareWithin);

    for (const cat of CATEGORY_ORDER) {
      out.push(...sortedGroup(cat));
      byCat.delete(cat);
    }

    const leftovers = Array.from(byCat.keys()).sort();
    for (const cat of leftovers) out.push(...sortedGroup(cat));

    return typeof limit === "number" ? out.slice(0, limit) : out;
  }, [filteredBase, sortKey, sortOrder, limit, inventoryMap]);

  const sortOptions = useMemo(
    () => [
      { value: "alpha", label: "ABC Alphabetical" },
      { value: "price", label: "$ Price" },
      { value: "potency", label: "% Potency" },
      { value: "rating", label: "★ Rating" },
    ],
    []
  );

  const orderOptions = useMemo(
    () => [
      { value: "asc", label: "Low → High / A → Z" },
      { value: "desc", label: "High → Low / Z → A" },
    ],
    []
  );

  return (
    <div className="mt-6">
      {/* FILTERS + SORT */}
      <div className="flex flex-col gap-4 mb-6">
        {subcategoryOptions.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              {/* keep your subcategory pills */}
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {subcategoryOptions.map((opt) => {
                  const selected = filters.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() =>
                        setFilters((cur) => (cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]))
                      }
                      className={`
                        px-3 py-1.5 rounded-2xl text-sm font-medium transition border
                        ${
                          selected
                            ? "bg-black/60 border-[var(--brand-gold)] shadow-[0_0_14px_#facc15,0_0_28px_#facc15]"
                            : "bg-black/40 hover:bg-black/60 border-transparent hover:shadow-[0_0_10px_#facc15]"
                        }
                      `}
                      aria-pressed={selected}
                    >
                      <span className="bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-sm opacity-80">Match:</span>
                {["ALL", "ANY"].map((mode) => {
                  const selected = matchMode === mode.toLowerCase();
                  return (
                    <button
                      key={mode}
                      onClick={() => setMatchMode(mode.toLowerCase() as MatchMode)}
                      className={`
                        px-3 py-1.5 rounded-2xl text-sm font-medium transition border
                        ${
                          selected
                            ? "bg-black/60 border-[var(--brand-gold)] shadow-[0_0_14px_#facc15,0_0_28px_#facc15]"
                            : "bg-black/40 hover:bg-black/60 border-transparent hover:shadow-[0_0_10px_#facc15]"
                        }
                      `}
                    >
                      <span className="bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent">
                        {mode}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filters.length > 0 && (
                <button
                  className="text-xs sm:text-sm underline hover:no-underline opacity-80"
                  onClick={() => setFilters([])}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {showSort && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 mb-6">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center justify-end gap-2">
                <FancySelect
                  value={sortKey}
                  onChange={(v) => setSortKey(v as SortKey)}
                  options={sortOptions}
                  label="Sort by"
                />

                <FancySelect
                  value={sortOrder}
                  onChange={(v) => setSortOrder(v as "asc" | "desc")}
                  options={orderOptions}
                  className="ml-1"
                />
              </div>

              {/* ✅ Compare button lives UNDER Low → High */}
              <ShopCompareToggle />
            </div>
          </div>
        )}
      </div>

      {/* EMPTY STATE */}
      {groupedSorted.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">
          No products match your selection.
          {filters.length > 0 && (
            <>
              {" "}
              <button className="underline hover:no-underline" onClick={() => setFilters([])}>
                Clear filters
              </button>
              .
            </>
          )}
        </div>
      )}

      {/* GRID */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" role="list" aria-label="Products">
        {groupedSorted.map((p: any) => {
          const qtyInfo = computeProductQtyInfo(p, inventoryMap);

          // ✅ sold out is driven by overlay when available, otherwise legacy fallbacks
          const soldOut = qtyInfo.hasOverlay ? qtyInfo.soldOut : false;
          const statusBadge = qtyInfo.hasOverlay ? qtyInfo.lowBadge : null;

          const marketingBadge = p?.badge ?? null;

          const raw = primaryImgFor(p);
          const finalSrc = isBadString(raw) ? "/images/placeholder.png" : raw;

          const variants = findVariantsFor(p);
          const hasVariants = !!variants?.length;
          const previewPriceCents = hasVariants
            ? Math.min(...variants!.map((v) => v.priceCents))
            : Number(p.price ?? 0);

          // ✅ IMPORTANT: new canonical product URL
          const productHref = `/shop/${encodeURIComponent(String(p.slug ?? ""))}`;

          const coaHref = coaUrlFor(p);

          return (
            <article
              key={String(p.id)}
              aria-label={String(p.name ?? "")}
              className="glow-card aura-strong aura-gold rounded-3xl overflow-hidden relative"
            >
              {/* ✅ top-left: stock badge (Sold out or low stock) */}
              <div className="absolute top-2 left-2 z-10">
                {soldOut ? (
                  <span className="inline-flex items-center rounded-full bg-black/90 px-2 py-0.5 text-[11px] font-semibold">
                    <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
                      Sold Out
                    </span>
                  </span>
                ) : statusBadge ? (
                  <span className="inline-flex items-center rounded-full bg-black/90 px-2 py-0.5 text-[11px] font-semibold">
                    <span className="bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent">
                      {statusBadge}
                    </span>
                  </span>
                ) : null}
              </div>

              {marketingBadge && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="inline-flex items-center rounded-full bg-black/90 px-2 py-0.5 text-[11px] font-semibold">
                    <span className="bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent">
                      {marketingBadge}
                    </span>
                  </span>
                </div>
              )}

              <div className="p-4">
                <div className="halo-window thin">
                  <div className="halo-wrap halo-clip rounded-2xl" style={{ ["--halo-cut" as any]: "36px" }}>
                    <div className="img-card rounded-2xl relative overflow-hidden">
                      <Link
                        href={productHref}
                        className="relative z-10 block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] rounded-2xl"
                      >
                        <BgImage src={finalSrc} alt={String(p.name ?? "")} />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="halo-gap" />

                <div className="mt-5">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      <Link href={productHref}>{String(p.name ?? "")}</Link>
                    </h3>

                    <ReviewBadge productSlug={String(p.slug ?? "")} />

                    <QuickFacts p={p} />

                    <p className="text-xs opacity-70 capitalize">{String(p.category ?? "")}</p>

                    {"potency" in p && (p as any).potency && (
                      <p className="text-xs opacity-70">{String((p as any).potency)}</p>
                    )}
                  </div>
                </div>

                {/* Compare + COA row */}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <ComparePill
                    item={{
                      id: String(p.id),
                      slug: String(p.slug),
                      name: String(p.name),
                      potency: (p as any).potency ?? null,
                      type: null,
                    }}
                  />
                  {coaHref ? <CoaVerifiedPill href={coaHref} /> : <span />}
                </div>

                <div className="mt-3 flex items-center justify-between relative pb-7">
                  <div className="text-xs text-neutral-400">
                    {hasVariants ? (
                      <>
                        from <span className="font-medium">{usd(previewPriceCents)}</span>
                      </>
                    ) : (
                      <span className="font-medium">{usd(previewPriceCents)}</span>
                    )}
                  </div>

                  {soldOut ? (
                    <button
                      className="rounded-full px-4 py-2 text-sm opacity-60 cursor-not-allowed border border-white/20"
                      disabled
                    >
                      Sold Out
                    </button>
                  ) : hasVariants ? (
                    <Link
                      href={productHref}
                      className="btn-gold rounded-full px-4 py-2 text-sm border border-[var(--brand-gold)] hover:opacity-90 transition"
                    >
                      View options
                    </Link>
                  ) : (
                    <AddToCartButton
                      id={String(p.id)}
                      name={String(p.name)}
                      image={finalSrc}
                      priceCents={Number(p.price ?? 0)}
                      className="btn-gold rounded-full px-4 py-2 text-sm border border-[var(--brand-gold)] hover:opacity-90 transition"
                      disabled={soldOut}
                    />
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default ProductGrid;
