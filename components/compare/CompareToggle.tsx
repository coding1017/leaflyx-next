"use client";

import { useEffect, useMemo, useState } from "react";
import { readCompare, toggleCompare, type CompareItem } from "@/lib/compare";

export default function CompareToggle({
  item,
  className = "",
}: {
  item: CompareItem;
  className?: string;
}) {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCompare());
    sync();

    const onCustom = () => sync();
    window.addEventListener("leaflyx-compare", onCustom as any);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("leaflyx-compare", onCustom as any);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const selected = useMemo(() => items.some((x) => x.id === item.id), [items, item.id]);
  const full = items.length >= 3 && !selected;

  return (
    <button
      type="button"
      disabled={full}
      onClick={() => {
        const next = toggleCompare(item);
        setItems(next);
        window.dispatchEvent(new Event("leaflyx-compare"));
      }}
      className={[
        "rounded-xl px-3 py-2 text-xs font-semibold border transition",
        selected
          ? "bg-[var(--brand-gold)] text-black border-black/70 shadow-[0_0_18px_rgba(212,175,55,0.22)]"
          : "bg-black/35 text-[var(--brand-gold)] border-[var(--brand-gold)]/45 hover:bg-black/45",
        full ? "opacity-50 cursor-not-allowed" : "",
        className,
      ].join(" ")}
      title={full ? "You can compare up to 3 items" : selected ? "Remove from compare" : "Add to compare"}
      aria-pressed={selected}
    >
      {selected ? "Compared ✓" : "Compare"}
    </button>
  );
}
