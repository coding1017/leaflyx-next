// components/ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VariantChooser from "@/components/VariantChooser";

import { readCompare, toggleCompare } from "@/components/compare/compare";
import { readCompareMode } from "@/components/compare/compareMode";

const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

export type Variant = { label: string; priceCents: number };

export type ProductForCard = {
  id: string;
  slug: string;
  name: string;
  image?: string;
  priceCents?: number;
  variants?: Variant[];
  subtitle?: string;
  potency?: string; // e.g. "28% THCA"
};

export default function ProductCard({ product }: { product: ProductForCard }) {
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      setCompareMode(readCompareMode());
      setCompareIds(readCompare().map((x) => x.id));
    };

    sync();

    const handler = () => sync();
    window.addEventListener("storage", handler);
    window.addEventListener("leaflyx-compare-mode", handler);
    window.addEventListener("leaflyx-compare", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("leaflyx-compare-mode", handler);
      window.removeEventListener("leaflyx-compare", handler);
    };
  }, []);

  const isSelected = useMemo(() => compareIds.includes(product.id), [compareIds, product.id]);

  function onToggleCompare(e: React.MouseEvent) {
    // IMPORTANT: prevent the Link click
    e.preventDefault();
    e.stopPropagation();

    const next = toggleCompare({
      id: product.id,
      slug: product.slug,
      name: product.name,
      potency: product.potency ?? null,
      type: product.subtitle ?? null,
    });

    setCompareIds(next.map((x) => x.id));
    // notify same-tab listeners (CompareBar, other cards)
    window.dispatchEvent(new Event("leaflyx-compare"));
  }

  return (
    <div className="rounded-3xl bg-black/20 border border-white/10 p-4 flex flex-col gap-3">
      {/* CLICKABLE AREA → product detail */}
      <Link href={`/shop/${encodeURIComponent(product.slug)}`} className="block group">
        {/* Image */}
        <div className="rounded-2xl overflow-hidden glow-card aura-strong bg-white">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-64 object-contain transition-transform group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-64 bg-white" />
          )}
        </div>

        {/* Text */}
        <div className="min-h-[60px] mt-3">
          <div className="font-semibold leading-snug">{product.name}</div>
          {product.subtitle && <div className="text-sm opacity-70">{product.subtitle}</div>}
          {product.potency && <div className="text-xs opacity-60">{product.potency}</div>}

          {/* ✅ Compare pill appears HERE: below potency, above price */}
          {compareMode ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={onToggleCompare}
                className={[
                  "inline-flex items-center justify-center",
                  "rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
                  "border transition",
                  isSelected
                    ? "bg-[var(--brand-gold)] text-black border-black/80 shadow-[0_10px_24px_rgba(212,175,55,0.28)]"
                    : "bg-black/35 text-[var(--brand-gold)] border-[var(--brand-gold)]/50 hover:bg-black/45",
                ].join(" ")}
                aria-pressed={isSelected}
              >
                {isSelected ? "Compared ✓" : "Compare+"}
              </button>
            </div>
          ) : null}
        </div>
      </Link>

      {/* Price preview */}
      <div className="text-sm opacity-80">
        {hasVariants ? (
          <>
            From{" "}
            <span className="font-medium">
              {usd(Math.min(...product.variants!.map((v) => v.priceCents)))}
            </span>
          </>
        ) : product.priceCents != null ? (
          <span className="font-medium">{usd(product.priceCents)}</span>
        ) : null}
      </div>

      {/* Actions (View options / variant chooser) */}
      <div className="mt-1">
        <VariantChooser product={product} />
      </div>
    </div>
  );
}
