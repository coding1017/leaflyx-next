// components/compare/ComparePill.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { readCompare, toggleCompare, type CompareItem } from "./compare";

export default function ComparePill({ item, className = "" }: { item: CompareItem; className?: string }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCompare());
    sync();

    const onStorage = () => sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("leaflyx-compare", onStorage as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("leaflyx-compare", onStorage as any);
    };
  }, []);

  const selected = useMemo(() => items.some((x) => x.id === item.id), [items, item.id]);
  const isFull = items.length >= 3 && !selected;

  return (
    <button
      type="button"
      disabled={isFull}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCompare(item);
        window.dispatchEvent(new Event("leaflyx-compare"));
      }}
      className={[
        // ❌ removed mt-2 so this component does NOT grow the card by itself
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold transition border",
        selected
          ? "bg-black/70 border-[var(--brand-gold)] shadow-[0_0_12px_rgba(212,175,55,0.25)]"
          : "bg-black/40 border-white/10 hover:border-[rgba(212,175,55,0.55)] hover:shadow-[0_0_10px_rgba(212,175,55,0.18)]",
        isFull ? "opacity-50 cursor-not-allowed" : "",
        className,
      ].join(" ")}
      aria-pressed={selected}
      title={isFull ? "You can compare up to 3 products" : undefined}
    >
      <span className="bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent">
        {selected ? "Compared ✓" : "Compare"}
      </span>

      {selected ? (
        <span className="text-[var(--brand-gold)]">✓</span>
      ) : (
        <span className="text-[rgba(212,175,55,0.75)]">+</span>
      )}
    </button>
  );
}
