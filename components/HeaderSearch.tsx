// components/HeaderSearch.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { products } from "@/lib/products";

type SearchItem = {
  id: string;
  name: string;
  slug: string; // /shop/p/[slug]
  image?: string;
  category?: string;
  tags?: string[];
};

const GOLD = "#d4af37";

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function cleanSlug(raw: string) {
  let s = String(raw || "").trim();
  s = s.replace(/^https?:\/\/[^/]+/i, ""); // strip domain
  s = s.replace(/^\/+/, ""); // strip leading slashes
  s = s.replace(/^shop\/p\/+/i, ""); // strip "shop/p/"
  s = s.replace(/^products\/+/i, ""); // strip "products/"
  s = s.replace(/\/+$/, ""); // strip trailing slash
  return s;
}

function toSearchItems(): SearchItem[] {
  return (products as any[]).map((p) => {
    const img =
      typeof p.image === "string"
        ? p.image
        : typeof p.image?.src === "string"
          ? p.image.src
          : typeof p.images?.[0] === "string"
            ? p.images[0]
            : typeof p.images?.[0]?.src === "string"
              ? p.images[0].src
              : undefined;

    return {
      id: String(p.id ?? p.productId ?? p.slug ?? p.name),
      name: String(p.name ?? p.title ?? "Unnamed"),
      slug: String(p.slug ?? p.handle ?? p.id ?? "").trim(),
      image: img,
      category: p.category ? String(p.category) : undefined,
      tags: Array.isArray(p.tags) ? p.tags.map(String) : undefined,
    };
  });
}

export default function HeaderSearch({
  placeholder = "Search products…",
  maxResults = 8,
  className = "",
  searchRouteBase = "/search",
  productRouteBase = "/shop/p",
}: {
  placeholder?: string;
  maxResults?: number;
  className?: string;
  searchRouteBase?: string;
  productRouteBase?: string;
}) {
  const router = useRouter();
  const items = React.useMemo(() => toSearchItems(), []);

  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<number>(-1);

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const results = React.useMemo(() => {
    const query = normalize(q);
    if (!query) return [];

    const scored = items
      .map((it) => {
        const name = normalize(it.name);
        const cat = normalize(it.category ?? "");
        const tags = (it.tags ?? []).map(normalize);

        let score = 0;
        if (name.includes(query)) score += 50;
        if (name.startsWith(query)) score += 20;
        if (cat.includes(query)) score += 8;
        if (tags.some((t) => t.includes(query))) score += 10;

        const parts = query.split(/\s+/).filter(Boolean);
        if (parts.length > 1) {
          const hay = `${name} ${cat} ${tags.join(" ")}`;
          const hitCount = parts.reduce((acc, p) => acc + (hay.includes(p) ? 1 : 0), 0);
          score += hitCount * 6;
        }

        return { it, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((x) => x.it);

    return scored;
  }, [q, items, maxResults]);

  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActive(-1);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function goToSearch(term: string) {
    const t = term.trim();
    if (!t) return;
    setOpen(false);
    setActive(-1);
    router.push(`${searchRouteBase}?q=${encodeURIComponent(t)}`);
  }

  function goToProduct(slug: string, fallbackName?: string) {
    const clean = cleanSlug(slug);

    if (!clean || clean.length < 2) {
      if (fallbackName) goToSearch(fallbackName);
      return;
    }

    setOpen(false);
    setActive(-1);
    router.push(`${productRouteBase}/${encodeURIComponent(clean)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      if (results.length) setOpen(true);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((prev) => Math.min(prev + 1, results.length - 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((prev) => Math.max(prev - 1, 0));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) {
        goToProduct(results[active].slug, results[active].name);
      } else {
        goToSearch(q);
      }
    }

    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {/* Search input (old look) */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-[var(--brand-green)] pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-90">
            <path
              d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16.5 16.5 21 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            setOpen(!!v.trim());
            setActive(-1);
          }}
          onFocus={() => setOpen(!!q.trim())}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          type="search"
          inputMode="search"
          className="
            w-full pl-9 pr-10 py-2 rounded-full
            border border-[var(--brand-green)]
            bg-white/75 text-[var(--brand-green)] placeholder:text-gray-600
            focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]
          "
          aria-label="Search products"
          aria-expanded={open}
          aria-controls="leaflyx-search-dropdown"
        />

        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setOpen(false);
              setActive(-1);
              inputRef.current?.focus();
            }}
            className="
              absolute right-2 grid h-8 w-8 place-items-center rounded-full
              text-[var(--brand-green)]/70 hover:text-[var(--brand-green)]
              hover:bg-black/5 transition
              outline-none focus:outline-none focus-visible:outline-none
            "
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {open ? (
        <div
          id="leaflyx-search-dropdown"
          className="
            absolute left-0 right-0 mt-2 z-50
            overflow-hidden rounded-2xl
            bg-[rgba(6,30,24,0.98)]
            ring-1 ring-white/10
            shadow-[0_25px_80px_rgba(0,0,0,0.60)]
            backdrop-blur-sm
          "
        >
          <div className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center justify-between gap-3 text-xs text-[rgba(212,175,55,0.85)]">
              <div className="min-w-0 truncate">
                {q.trim() ? (
                  <>
                    Search for{" "}
                    <span className="text-[var(--brand-gold)] font-medium">“{q.trim()}”</span>
                  </>
                ) : (
                  "Start typing to search…"
                )}
              </div>

              {q.trim() ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goToSearch(q)}
                  className="
                    shrink-0 rounded-full px-2 py-1
                    bg-black/35 text-[var(--brand-gold)]
                    ring-1 ring-white/10
                    hover:bg-black/45 transition
                    outline-none focus:outline-none focus-visible:outline-none
                  "
                  style={{
                    boxShadow: `0 0 0 1px rgba(212,175,55,0.28), 0 0 14px rgba(212,175,55,0.16)`,
                  }}
                >
                  Enter ↵
                </button>
              ) : null}
            </div>
          </div>

          {results.length ? (
            <ul className="max-h-[420px] overflow-auto py-1">
              {results.map((it, idx) => {
                const isRowActive = idx === active;
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToProduct(it.slug, it.name)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 text-left
                        transition
                        outline-none focus:outline-none focus-visible:outline-none
                        ${isRowActive ? "bg-white/10" : "hover:bg-white/5"}
                      `}
                    >
                      {/* Thumbnail */}
                      <div
                        className="
                          relative h-10 w-10 shrink-0 overflow-hidden rounded-xl
                          bg-white/10 ring-1 ring-white/10
                        "
                        style={
                          isRowActive
                            ? {
                                boxShadow: `0 0 0 1px rgba(212,175,55,0.30), 0 0 18px rgba(212,175,55,0.18)`,
                              }
                            : undefined
                        }
                      >
                        {it.image ? (
                          <Image src={it.image} alt={it.name} fill sizes="40px" className="object-cover" />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-white/35 text-xs">—</div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="truncate text-sm text-[rgba(212,175,55,0.95)]">
  {it.name}
</div>


                          {/* ✅ Category pill — hard gold, NO Tailwind default blue ring */}
                          {it.category ? (
                            <span
                              className="
                                shrink-0 rounded-full px-2 py-0.5 text-[11px]
                                bg-black/35 text-[var(--brand-gold)]
                                border
                                outline-none
                              "
                              style={{
                                borderColor: "rgba(212,175,55,0.35)",
                                boxShadow: "0 0 10px rgba(212,175,55,0.10)",
                              }}
                            >
                              {it.category}
                            </span>
                          ) : null}
                        </div>

                        {it.tags?.length ? (
                          <div className="mt-0.5 text-[11px] text-[rgba(212,175,55,0.65)] truncate">
                            {it.tags.slice(0, 4).join(" • ")}
                          </div>
                        ) : (
                          <div className="mt-0.5 text-[11px] text-[rgba(212,175,55,0.6)] truncate">
  Click to open
</div>
                        )}
                      </div>

                      <div
  className={
    isRowActive
      ? "text-[var(--brand-gold)]"
      : "text-[rgba(212,175,55,0.45)]"
  }
>
                        ›
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-3 py-3 text-sm text-white/65">
              No matches. Try a strain name, category, or tag.
            </div>
          )}

          <div className="h-[2px] bg-gradient-to-r from-transparent via-[var(--brand-gold)]/60 to-transparent" />
        </div>
      ) : null}
    </div>
  );
}
