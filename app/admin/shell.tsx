// app/admin/shell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { LayoutGrid, Boxes, Star, Tag, Mail, ChevronLeft, ChevronRight } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutGrid className="h-4 w-4" /> },
  { href: "/admin/inventory", label: "Inventory", icon: <Boxes className="h-4 w-4" /> },
  { href: "/admin/products", label: "Products", icon: <Package className="h-4 w-4" /> },
  { href: "/admin/reviews", label: "Reviews", icon: <Star className="h-4 w-4" /> },
  { href: "/admin/discounts", label: "Discounts", icon: <Tag className="h-4 w-4" /> },
  { href: "/admin/emails", label: "Emails", icon: <Mail className="h-4 w-4" /> },
];

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/**
 * Leaflyx Admin Shell
 * ✅ Inherits the global site background (no admin-only black world)
 * ✅ Uses SOLID surfaces (Safari-friendly)
 * ✅ Keeps gold borders + emerald tones
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("leaflyx_admin_sidebar_collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((v) => {
      const next = !v;
      window.localStorage.setItem("leaflyx_admin_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  const activeHref = useMemo(() => {
    const exact = NAV.find((n) => n.href === pathname);
    if (exact) return exact.href;

    const hits = NAV.filter((n) => n.href !== "/admin" && pathname.startsWith(n.href));
    if (!hits.length) return "/admin";
    return hits.sort((a, b) => b.href.length - a.href.length)[0].href;
  }, [pathname]);

  return (
    // ✅ Let global Leaflyx background render (from app/layout + globals.css)
    <div className="min-h-screen bg-transparent text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cx(
            // ✅ SOLID surface (no transparency / blur)
            "sticky top-0 h-screen border-r border-[rgba(245,215,122,0.40)] bg-[#0b1f16]",
            collapsed ? "w-[72px]" : "w-[260px]"
          )}
        >
          <div className="h-full flex flex-col">
            <div className="px-4 py-4 border-b border-[rgba(245,215,122,0.22)]">
              <div className="flex items-center justify-between">
                <Link href="/admin" className="flex items-center gap-2 min-w-0">
                  <div
                    className="
                      h-9 w-9 rounded-2xl grid place-items-center
                      border border-[rgba(245,215,122,0.75)]
                      bg-[#0f2a1f]
                      shadow-[0_0_18px_rgba(245,215,122,0.18)]
                    "
                  >
                    <span className="text-[var(--brand-gold)] font-bold">L</span>
                  </div>

                  {!collapsed ? (
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-none">Leaflyx Admin</div>
                      <div className="text-xs text-white/70 mt-1 leading-none truncate">
                        Inventory • Reviews • Discounts • Emails
                      </div>
                    </div>
                  ) : null}
                </Link>

                <button
                  onClick={toggle}
                  className="
                    rounded-full border border-[rgba(245,215,122,0.35)]
                    bg-[#0f2a1f]
                    hover:bg-[#123426]
                    transition
                    h-9 w-9 grid place-items-center
                  "
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  title={collapsed ? "Expand" : "Collapse"}
                >
                  {collapsed ? (
                    <ChevronRight className="h-4 w-4 text-white/80" />
                  ) : (
                    <ChevronLeft className="h-4 w-4 text-white/80" />
                  )}
                </button>
              </div>
            </div>

            <nav className="px-2 py-3 space-y-1">
              {NAV.map((item) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                      active
                        ? "border border-[rgba(245,215,122,0.75)] bg-[#0f2a1f] shadow-[0_0_18px_rgba(245,215,122,0.12)]"
                        : "border border-transparent hover:border-[rgba(245,215,122,0.22)] hover:bg-[#0f2a1f]"
                    )}
                    title={item.label}
                  >
                    <span
                      className={cx(
                        "grid place-items-center h-8 w-8 rounded-xl border",
                        active
                          ? "border-[rgba(245,215,122,0.70)] bg-[#123426] text-[var(--brand-gold)]"
                          : "border-[rgba(245,215,122,0.22)] bg-[#0f2a1f] text-white/80"
                      )}
                    >
                      {item.icon}
                    </span>

                    {!collapsed ? (
                      <span className={cx(active ? "text-white" : "text-white/85")}>{item.label}</span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto p-3 border-t border-[rgba(245,215,122,0.22)]">
              {!collapsed ? (
                <div className="text-xs text-white/70">
                  Tip: Sidebar state is saved automatically.
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 bg-transparent">
          {/* ✅ Solid “page container” surface with gold border, but lets outer bg show around it */}
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="rounded-[28px] border border-[rgba(245,215,122,0.55)] bg-[#0f2a1f] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
