// components/ShopMenu.tsx
"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  active?: boolean; // highlight trigger when current route is "shop"
  pillClass?: string; // passed from Header (fallback provided)
  textClass?: string; // passed from Header (fallback provided)
  activeGlowClass?: string; // stronger active glow class (fallback provided)
};

const CATEGORIES = [
  { label: "Flower", slug: "flower" },
  { label: "Smalls", slug: "smalls" },
  { label: "Edibles", slug: "edibles" },
  { label: "Vapes", slug: "vapes" },
  { label: "Concentrates", slug: "concentrates" },
  { label: "Pre-Rolls", slug: "pre-rolls" },
  { label: "Beverages", slug: "beverages" },
  { label: "All Products", slug: "all" },
];

export default function ShopMenu({
  active = false,
  pillClass,
  textClass,
  activeGlowClass,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeTimeout = useRef<number | null>(null);

  // Cursor-follow glow
  const [glow, setGlow] = useState({ x: 0, y: 0, on: false });

  // ---- Fallback styles (used if Header doesn't pass classes) ----
  const fallbackPill =
    "group inline-flex items-center justify-center rounded-2xl px-3 py-1.5 " +
    "bg-black/40 text-white hover:bg-black/60 " +
    "hover:shadow-[0_0_14px_#facc15,0_0_28px_#facc15] transition text-sm";
  const fallbackText =
    "bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent";
  const fallbackActiveGlow =
    "ring-2 ring-yellow-300/60 shadow-[0_0_24px_#facc15,0_0_48px_#facc15,0_0_72px_rgba(250,204,21,0.6)]";

  const pill = pillClass ?? fallbackPill;
  const gradientText = textClass ?? fallbackText;
  const activeGlowClassResolved = activeGlowClass ?? fallbackActiveGlow;

  // Close on outside click / ESC
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (!rootRef.current?.contains(t)) setOpen(false);
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

  function clearCloseTimeout() {
    if (closeTimeout.current) {
      window.clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  }
  function delayedClose() {
    clearCloseTimeout();
    closeTimeout.current = window.setTimeout(() => setOpen(false), 120);
  }

  function onPanelMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    setGlow({ x, y, on: true });
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        clearCloseTimeout();
        setOpen(true);
      }}
      onMouseLeave={delayedClose}
      onFocus={() => setOpen(true)}
      onBlur={delayedClose}
    >
      {/* Trigger pill: navigates to /products but also opens the dropdown */}
      <Link
        href="/products"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${pill} ${active ? activeGlowClassResolved : ""} gap-1`}
      >
        <span className={gradientText}>Shop</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </Link>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Shop by category"
          className="
            absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0
            top-full mt-2 w-[min(92vw,720px)] rounded-2xl p-3 z-[60]
            backdrop-blur-xl

            /* ✅ Less-dark panel, better flow */
            bg-[linear-gradient(180deg,rgba(212,175,55,0.28),rgba(0,0,0,0.55))]
            border border-[#d4af37]
            shadow-[inset_0_1px_10px_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.45)]

            max-h-[60vh] overflow-y-auto overscroll-contain
            [scrollbar-width:thin] [scrollbar-color:#d4af37_transparent]
            [-webkit-overflow-scrolling:touch]
          "
          style={
            {
              // used by the cursor-follow glow overlay below
              ["--mx" as any]: `${glow.x}px`,
              ["--my" as any]: `${glow.y}px`,
            } as React.CSSProperties
          }
          onMouseEnter={() => {
            clearCloseTimeout();
            setGlow((g) => ({ ...g, on: true }));
          }}
          onMouseLeave={() => {
            delayedClose();
            setGlow((g) => ({ ...g, on: false }));
          }}
          onMouseMove={onPanelMove}
        >
          {/* ✅ Cursor-follow glow (subtle, premium) */}
          <div
            className="
              pointer-events-none absolute inset-0 rounded-2xl
              opacity-0 transition-opacity duration-150
            "
            style={{
              opacity: glow.on ? 1 : 0,
              background:
                "radial-gradient(240px circle at var(--mx) var(--my), rgba(212,175,55,0.22), transparent 60%)",
            }}
          />

          {/* Subtle gold hazes (kept) */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_55%)]" />

          {/* ✅ Row dividers (responsive) */}
          {/* Mobile (2 cols => 4 rows): lines at 25/50/75% */}
          <div className="pointer-events-none absolute inset-0 hidden rounded-2xl md:block">
            {/* md+ (4 cols => 2 rows): single mid divider */}
            <div className="absolute left-3 right-3 top-1/2 h-px bg-[#d4af37]/20" />
            <div className="absolute left-3 right-3 top-1/2 h-px bg-white/5" />
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-2xl md:hidden">
            <div className="absolute left-3 right-3 top-1/4 h-px bg-[#d4af37]/18" />
            <div className="absolute left-3 right-3 top-2/4 h-px bg-[#d4af37]/18" />
            <div className="absolute left-3 right-3 top-3/4 h-px bg-[#d4af37]/18" />
            <div className="absolute left-3 right-3 top-1/4 h-px bg-white/5" />
            <div className="absolute left-3 right-3 top-2/4 h-px bg-white/5" />
            <div className="absolute left-3 right-3 top-3/4 h-px bg-white/5" />
          </div>

          {/* Content */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={
                  c.slug === "all"
                    ? "/products"
                    : `/category/${encodeURIComponent(c.slug)}`
                }
                className="
                  block rounded-xl px-3 py-2 text-sm
                  /* ✅ Keep pills dark for contrast */
                  bg-black/60 hover:bg-black/75
                  border border-white/10 hover:border-[#d4af37]/40
                  hover:shadow-[0_0_14px_rgba(212,175,55,0.28)]
                  transition
                "
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span className={gradientText}>{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
