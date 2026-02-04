"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // ✅ added
import { clearCompare, readCompare, removeCompare, type CompareItem } from "@/lib/compare";

export default function CompareBar() {
  const pathname = usePathname(); // ✅ added

  // ✅ Hide compare bar on the compare page (and any subroutes)
  if (pathname?.startsWith("/compare")) return null;

  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCompare());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("leaflyx-compare", sync as any);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("leaflyx-compare", sync as any);
    };
  }, []);

  const count = items.length;

  const compareHref = useMemo(() => {
    const slugs = items.map((i) => encodeURIComponent(i.slug)).join(",");
    return `/compare?items=${slugs}`;
  }, [items]);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(980px,calc(100vw-24px))]">
      <div
        className="
          rounded-2xl
          border border-[var(--brand-gold)]
          bg-black/70 backdrop-blur-xl
          shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_34px_rgba(212,175,55,0.28)]
          px-4 py-3
        "
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm font-extrabold tracking-wide text-[var(--brand-gold)]">
              Compare ({count}/3)
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {items.map((it) => (
                <span
                  key={it.id}
                  className="
                    inline-flex items-center gap-2
                    rounded-full
                    border border-[var(--brand-gold)]
                    bg-black/55
                    px-3 py-1
                    text-xs font-semibold
                    text-white
                    shadow-[0_0_14px_rgba(212,175,55,0.22)]
                  "
                >
                 <span
  className="
    max-w-[220px] truncate
    font-semibold
    bg-gradient-to-r from-lime-400 to-yellow-300
    bg-clip-text text-transparent
  "
>
  {it.name}
</span>


                  <button
                    type="button"
                    onClick={() => {
                      removeCompare(it.id);
                      window.dispatchEvent(new Event("leaflyx-compare"));
                      setItems(readCompare());
                    }}
                    className="
                      text-[var(--brand-gold)]
                      opacity-80 hover:opacity-100
                      hover:shadow-[0_0_10px_rgba(212,175,55,0.28)]
                      transition
                    "
                    aria-label={`Remove ${it.name}`}
                    title="Remove"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                clearCompare();
                window.dispatchEvent(new Event("leaflyx-compare"));
                setItems([]);
              }}
              className="
                rounded-xl
                border border-[var(--brand-gold)]/55
                bg-black/50
                px-3 py-2
                text-xs font-semibold
                text-[var(--brand-gold)]
                hover:border-[var(--brand-gold)]
                hover:shadow-[0_0_16px_rgba(212,175,55,0.22)]
                transition
              "
            >
              Clear
            </button>

            <Link
              href={compareHref}
              className="
                rounded-xl
                px-4 py-2
                text-sm font-extrabold
                bg-[var(--brand-gold)]
                text-black
                border border-black/70
                shadow-[0_8px_20px_rgba(212,175,55,0.42)]
                hover:brightness-110
                transition
              "
            >
              Compare
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
