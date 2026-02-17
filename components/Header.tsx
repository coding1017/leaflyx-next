// components/Header.tsx
"use client";

import AnnouncementBar from "./AnnouncementBar";
import Link from "next/link";
import { useCart } from "./CartContext";
import {
  ShoppingCart,
  User,
  LogOut,
  Package,
  SlidersHorizontal,
  Menu,
  X,
} from "lucide-react";
import ShopMenu from "./ShopMenu";
import MiniCart from "@/components/MiniCart";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";

import HeaderTunerPanel from "./header/HeaderTunerPanel";
import { useHeaderLayoutTuner } from "./header/useHeaderLayoutTuner";

import HeaderSearch from "@/components/HeaderSearch";

function initialsFrom(name?: string | null, email?: string | null) {
  const src = (name || "").trim() || (email || "").trim();
  if (!src) return "U";
  const parts = src.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function useProgressiveHeader(opts: {
  minY: number;
  headerH: number;
  peekPx: number;
  jitterPx?: number;
}) {
  const { minY, headerH, peekPx, jitterPx = 2 } = opts;

  const maxHide = Math.max(0, headerH - peekPx);
  const [offset, setOffset] = useState(0);

  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    setOffset((v) => Math.min(Math.max(v, 0), maxHide));
  }, [maxHide]);

  useEffect(() => {
    lastYRef.current = window.scrollY || 0;

    const onScroll = () => {
      const y = window.scrollY || 0;
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        const lastY = lastYRef.current;
        const diff = y - lastY;

        if (Math.abs(diff) < jitterPx) {
          lastYRef.current = y;
          tickingRef.current = false;
          return;
        }

        if (y < minY || maxHide === 0) {
          setOffset(0);
          lastYRef.current = y;
          tickingRef.current = false;
          return;
        }

        setOffset((prev) => {
          const next = prev + diff;
          return Math.min(Math.max(next, 0), maxHide);
        });

        lastYRef.current = y;
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [minY, maxHide, jitterPx]);

  return offset;
}

export function Header() {
  const cart = useCart();
  const ctxCount = (cart as any)?.count;
  const items = cart?.items ?? [];
  const computedCount = Array.isArray(items)
    ? items.reduce((sum: number, i: any) => sum + (i?.qty ?? i?.quantity ?? 1), 0)
    : 0;
  const count = typeof ctxCount === "number" ? ctxCount : computedCount;

  const pathname = usePathname();
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const init = useMemo(
    () => initialsFrom((session?.user as any)?.name, session?.user?.email),
    [session?.user]
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  // ✅ Mobile Search expands into “second row” (no blur/overlay)
  const [searchRowOpen, setSearchRowOpen] = useState(false);
  const searchRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
    setSearchRowOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
        setSearchRowOpen(false);
      }
    }

    function onClickOutside(e: MouseEvent) {
      const t = e.target as Node;

      if (menuOpen && menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (mobileOpen && mobilePanelRef.current && !mobilePanelRef.current.contains(t)) setMobileOpen(false);

      // close search row when tapping outside it
      if (searchRowOpen && searchRowRef.current && !searchRowRef.current.contains(t)) {
        setSearchRowOpen(false);
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClickOutside);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [menuOpen, mobileOpen, searchRowOpen]);

  // Auto-focus the input inside the expanded row
  useEffect(() => {
    if (!searchRowOpen) return;
    const id = requestAnimationFrame(() => {
      const el = searchRowRef.current;
      const input = el?.querySelector("input") as HTMLInputElement | null;
      input?.focus?.();
    });
    return () => cancelAnimationFrame(id);
  }, [searchRowOpen]);

  const pill =
    "group inline-flex items-center justify-center rounded-2xl px-3 py-1.5 " +
    "bg-black/40 hover:bg-black/60 transition text-sm " +
    "hover:shadow-[0_0_14px_#facc15,0_0_28px_#facc15]";

  const shopPill = pill.replace("px-3", "px-6");

  const gradientText =
    "bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent";

  const activeGlow =
    "ring-2 ring-yellow-300/60 shadow-[0_0_24px_#facc15,0_0_48px_#facc15,0_0_72px_rgba(250,204,21,0.6)]";
  const subtleGlow =
    "ring-1 ring-yellow-300/35 shadow-[0_0_18px_rgba(250,204,21,0.28),0_0_36px_rgba(250,204,21,0.22)]";

  const hamburgerGlowOpen =
    "ring-2 ring-yellow-300/70 shadow-[0_0_24px_#facc15,0_0_60px_rgba(250,204,21,0.55)]";

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    if (href === "/shop") {
      return pathname.startsWith("/products") || pathname.startsWith("/category") || pathname.startsWith("/shop");
    }
    return pathname.startsWith(href);
  };

  const NavLink = ({
    href,
    label,
    onClick,
    className,
  }: {
    href: string;
    label: string;
    onClick?: () => void;
    className?: string;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={`${pill} ${active ? activeGlow : ""} ${className ?? ""}`}
      >
        <span className={gradientText}>{label}</span>
      </Link>
    );
  };

  async function doSignOut() {
    setMenuOpen(false);
    setMobileOpen(false);
    setSearchRowOpen(false);
    await signOut({ callbackUrl: "/" });
  }

  const { tuner, clampPatch, reset } = useHeaderLayoutTuner();
  const [tuneOpen, setTuneOpen] = useState(false);

  const headerRef = useRef<HTMLElement | null>(null);
  const [headerH, setHeaderH] = useState(0);

  useEffect(() => {
    if (!headerRef.current) return;
    const el = headerRef.current;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setHeaderH(Math.round(rect.height));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const hideOffset = useProgressiveHeader({
    minY: 150,
    headerH,
    peekPx: 8,
    jitterPx: 2,
  });

  return (
    <>
      <div aria-hidden="true" style={{ height: Math.max(0, headerH - hideOffset) }} />

      <header
        ref={headerRef as any}
        className="fixed top-0 left-0 right-0 z-50 will-change-transform"
        style={{ transform: `translateY(-${hideOffset}px)` }}
      >
        {/* Make iOS inputs readable + prevent weird zoom */}
        <style jsx global>{`
          .leaflyx-mobile-search-row input {
            font-size: 16px !important;
            line-height: 1.2 !important;
          }
        `}</style>

        <div
          className="
            relative
            backdrop-blur-md
            bg-gradient-to-r from-[rgba(212,175,55,0.35)] via-[rgba(180,140,40,0.35)] to-[rgba(212,175,55,0.35)]
            hover:from-[rgba(212,175,55,0.45)] hover:via-[rgba(180,140,40,0.45)] hover:to-[rgba(212,175,55,0.45)]
            border-b-2 border-[#d4af37]
            shadow-[inset_0_1px_8px_rgba(255,255,255,0.1),0_2px_12px_rgba(0,0,0,0.35)]
            transition-colors overflow-visible
          "
        >
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(255,220,150,0.25),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(255,220,150,0.25),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,230,180,0.15),transparent_75%)]" />
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.4)] to-transparent z-20" />

          {/* Row 1 */}
          <div className="relative z-10 max-w-6xl mx-auto px-3 py-2 flex items-center gap-3">
            {/* Left: ☰ + Leaflyx */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className={`${pill} md:hidden relative shrink-0 !px-2 ${mobileOpen ? `${activeGlow} ${hamburgerGlowOpen}` : ""}`}
              >
                {mobileOpen ? <X className="h-5 w-5 text-white/90" /> : <Menu className="h-5 w-5 text-white/90" />}
              </button>

              <Link
                href="/"
                aria-current={isActive("/") ? "page" : undefined}
                className={`${pill} gap-2 shrink-0 ${isActive("/") ? activeGlow : ""}`}
              >
                <span className={`font-semibold tracking-tight ${gradientText}`}>Leaflyx</span>
              </Link>
            </div>

            {/* Middle: compact search trigger (tap opens row 2) */}
            <div className="flex-1 min-w-0 md:hidden">
              {!searchRowOpen ? (
                <button
                  type="button"
                  onClick={() => setSearchRowOpen(true)}
                  className="
                    w-full rounded-2xl px-3 py-2
                    bg-black/25 hover:bg-black/35
                    border border-white/10
                    text-left
                    flex items-center gap-2
                  "
                  aria-label="Open search"
                >
                  <span className="text-white/60">Search products…</span>
                </button>
              ) : (
                <div className="h-[40px]" aria-hidden="true" />
              )}
            </div>

            {/* Desktop center: nav + search (unchanged) */}
            <div className="hidden md:flex flex-1 items-center justify-center" style={{ gap: `${tuner.centerGap}px` }}>
              <nav className="hidden md:flex items-center gap-4" aria-label="Primary">
                <ShopMenu
                  active={isActive("/shop")}
                  pillClass={shopPill}
                  textClass={gradientText}
                  activeGlowClass={activeGlow}
                />
                <NavLink href="/about" label="About" />
                <NavLink href="/faq" label="FAQ" />
                <NavLink href="/coa" label="COA" />
              </nav>

              <div
                className="relative hidden sm:block"
                role="search"
                aria-label="Site search"
                style={{
                  width: `${tuner.searchWidth}px`,
                  transform: `translate(${tuner.searchX}px, ${tuner.searchY}px)`,
                }}
              >
                <HeaderSearch placeholder="Search products…" searchRouteBase="/search" productRouteBase="/shop" />
              </div>
            </div>

            {/* Right cluster */}
            <div className="ml-auto flex items-center shrink-0" style={{ gap: `${tuner.rightGap}px` }}>
              {process.env.NODE_ENV === "development" ? (
                <div className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setTuneOpen((v) => !v)}
                    aria-label="Tune header layout"
                    className={`${pill} ${tuneOpen ? activeGlow : ""} !px-2`}
                  >
                    <SlidersHorizontal className="h-4 w-4 text-white/90" />
                  </button>

                  <HeaderTunerPanel
                    open={tuneOpen}
                    onClose={() => setTuneOpen(false)}
                    tuner={tuner}
                    onPatch={(p) => clampPatch(p)}
                    onReset={() => reset()}
                  />
                </div>
              ) : null}

              {/* Profile dropdown */}
              <div ref={menuRef} className="relative" style={{ transform: `translate(${tuner.profileX}px, ${tuner.profileY}px)` }}>
                {authed ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMenuOpen((v) => !v)}
                      aria-label="Account menu"
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                      className={`${pill} ${menuOpen || isActive("/account") ? activeGlow : ""} relative shrink-0 !px-2`}
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-black/35 ring-1 ring-[var(--brand-gold)] shadow-[0_0_12px_rgba(212,175,55,.35)]">
                        <span className="text-[11px] font-semibold text-[var(--brand-gold)]">{init}</span>
                      </span>
                    </button>

                    {menuOpen ? (
                      <div
                        role="menu"
                        className="
                          absolute right-0 mt-2 w-56
                          rounded-2xl border border-white/10
                          bg-black/80 backdrop-blur
                          shadow-[0_20px_80px_rgba(0,0,0,0.55)]
                          overflow-hidden
                        "
                      >
                        <div className="px-3 py-2 border-b border-white/10">
                          <div className="text-xs text-white/55">Signed in as</div>
                          <div className="text-sm text-white/85 truncate">{session?.user?.email ?? "—"}</div>
                        </div>

                        <Link
                          role="menuitem"
                          href="/account"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                        >
                          <User className="h-4 w-4 text-[var(--brand-gold)]" />
                          Account
                        </Link>

                        <Link
                          role="menuitem"
                          href="/account/orders"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                        >
                          <Package className="h-4 w-4 text-[var(--brand-gold)]" />
                          Orders
                        </Link>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={doSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/85 hover:bg-white/10 border-t border-white/10"
                        >
                          <LogOut className="h-4 w-4 text-[var(--brand-gold)]" />
                          Sign out
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <Link href="/sign-in" aria-label="Sign in" title="Sign in" className={`${pill} relative shrink-0 !px-2`}>
                    <User className="h-5 w-5 text-white" aria-hidden="true" />
                  </Link>
                )}
              </div>

              {/* Cart */}
              <MiniCart>
                {({ open, toggle }: { open: boolean; toggle: () => void }) => {
                  const onCartPage = pathname === "/cart";
                  const glowClass =
                    open || onCartPage ? activeGlow : count > 0 ? `${subtleGlow} pulse-gold` : "";

                  return (
                    <button
                      onClick={toggle}
                      aria-label="Cart"
                      aria-haspopup="dialog"
                      aria-expanded={open}
                      className={`${pill} ${glowClass} relative shrink-0`}
                    >
                      <ShoppingCart className="w-5 h-5 text-white transition" aria-hidden="true" />
                      {count > 0 && (
                        <span
                          className="
                            absolute -top-[7px] -right-[8px]
                            min-w-[18px] h-5 px-1
                            grid place-items-center rounded-full text-[10px] font-semibold
                            bg-[var(--brand-green)] text-[var(--brand-gold)]
                            ring-1 ring-[var(--brand-gold)]
                            shadow-[0_0_10px_rgba(212,175,55,.45)]
                            pointer-events-none
                          "
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                }}
              </MiniCart>
            </div>
          </div>

          {/* ✅ Row 2: expanded search drawer (no blur overlay) */}
          {searchRowOpen ? (
            <div className="relative z-10 md:hidden px-3 pb-3">
              <div
                ref={searchRowRef}
                className="
                  leaflyx-mobile-search-row
                  rounded-3xl border border-[#d4af37]/65
                  bg-black/55 backdrop-blur-md
                  shadow-[0_18px_80px_rgba(0,0,0,0.55)]
                  overflow-hidden
                  p-2
                "
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <HeaderSearch placeholder="Search products…" searchRouteBase="/search" productRouteBase="/shop" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setSearchRowOpen(false)}
                    className="shrink-0 rounded-2xl px-3 py-2 text-sm font-semibold"
                    style={{
                      border: "1px solid rgba(212,175,55,0.7)",
                      color: "#d4af37",
                      background: "rgba(0,0,0,0.35)",
                      boxShadow: "0 0 18px rgba(212,175,55,0.18)",
                    }}
                    aria-label="Close search"
                  >
                    Done
                  </button>
                </div>

                <div
                  aria-hidden
                  className="mt-2 h-[2px] rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(212,175,55,0.0), rgba(212,175,55,0.75), rgba(212,175,55,0.0))",
                    boxShadow: "0 0 18px rgba(212,175,55,0.35)",
                    opacity: 0.95,
                  }}
                />
              </div>
            </div>
          ) : null}

          {/* Mobile menu panel + divider */}
          <div className={`md:hidden relative z-10 px-3 pb-3 ${mobileOpen ? "block" : "hidden"}`}>
            <div
              ref={mobilePanelRef}
              className="
                mt-2 rounded-3xl border border-[#d4af37]/55
                bg-black/55 backdrop-blur-md
                shadow-[0_18px_80px_rgba(0,0,0,0.55)]
                overflow-hidden
              "
            >
              <div className="p-3 flex flex-wrap gap-2">
                <NavLink href="/products" label="Shop" onClick={() => setMobileOpen(false)} className="!px-6" />
                <NavLink href="/about" label="About" onClick={() => setMobileOpen(false)} />
                <NavLink href="/faq" label="FAQ" onClick={() => setMobileOpen(false)} />
                <NavLink href="/coa" label="COA" onClick={() => setMobileOpen(false)} />

                {authed ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className={`${pill} ${isActive("/account") ? activeGlow : ""}`}
                    >
                      <span className={gradientText}>Account</span>
                    </Link>

                    <button type="button" onClick={doSignOut} className={`${pill} border border-white/10`}>
                      <span className={gradientText}>Sign out</span>
                    </button>
                  </>
                ) : (
                  <Link href="/sign-in" onClick={() => setMobileOpen(false)} className={`${pill} border border-white/10`}>
                    <span className={gradientText}>Sign in</span>
                  </Link>
                )}
              </div>
            </div>

            <div
              aria-hidden
              className="mx-2 mt-2 h-[2px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(212,175,55,0.0), rgba(212,175,55,0.75), rgba(212,175,55,0.0))",
                boxShadow: "0 0 18px rgba(212,175,55,0.35)",
                opacity: 0.95,
              }}
            />
          </div>
        </div>

        <AnnouncementBar />
      </header>
    </>
  );
}
