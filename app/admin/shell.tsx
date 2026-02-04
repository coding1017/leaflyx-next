// app/admin/shell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { LayoutGrid, Boxes, Star, Tag, ChevronLeft, ChevronRight } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutGrid className="h-4 w-4" /> },
  { href: "/admin/inventory", label: "Inventory", icon: <Boxes className="h-4 w-4" /> },
  { href: "/admin/reviews", label: "Reviews", icon: <Star className="h-4 w-4" /> },
  { href: "/admin/discounts", label: "Discounts", icon: <Tag className="h-4 w-4" /> },
];

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

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
    // exact match first
    const exact = NAV.find((n) => n.href === pathname);
    if (exact) return exact.href;

    // fallback: longest prefix match
    const hits = NAV.filter((n) => n.href !== "/admin" && pathname.startsWith(n.href));
    if (!hits.length) return "/admin";
    return hits.sort((a, b) => b.href.length - a.href.length)[0].href;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* subtle leafy ribbon / glow */}
      <div
        className="
          pointer-events-none fixed inset-0 -z-10
          opacity-60
          [background:radial-gradient(900px_520px_at_15%_10%,rgba(212,175,55,0.18),transparent_60%),radial-gradient(820px_520px_at_90%_25%,rgba(16,185,129,0.10),transparent_55%)]
        "
      />

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cx(
            "sticky top-0 h-screen border-r border-white/10 bg-black/40 backdrop-blur-xl",
            collapsed ? "w-[72px]" : "w-[260px]"
          )}
        >
          <div className="h-full flex flex-col">
            {/* Brand / header */}
            <div className="px-4 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <Link href="/admin" className="flex items-center gap-2 min-w-0">
                  <div
                    className="
                      h-9 w-9 rounded-2xl grid place-items-center
                      border border-[var(--brand-gold)]/60
                      bg-black/30
                      shadow-[0_0_18px_rgba(212,175,55,0.18)]
                    "
                  >
                    <span className="text-[var(--brand-gold)] font-bold">L</span>
                  </div>

                  {!collapsed ? (
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-none">Leaflyx Admin</div>
                      <div className="text-xs text-white/50 mt-1 leading-none truncate">
                        Inventory • Reviews • Discounts
                      </div>
                    </div>
                  ) : null}
                </Link>

                <button
                  onClick={toggle}
                  className="
                    rounded-full border border-white/10 bg-black/30
                    hover:bg-black/50 transition
                    h-9 w-9 grid place-items-center
                  "
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  title={collapsed ? "Expand" : "Collapse"}
                >
                  {collapsed ? (
                    <ChevronRight className="h-4 w-4 text-white/70" />
                  ) : (
                    <ChevronLeft className="h-4 w-4 text-white/70" />
                  )}
                </button>
              </div>
            </div>

            {/* Nav */}
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
                        ? "border border-[var(--brand-gold)]/60 bg-black/40 shadow-[0_0_18px_rgba(212,175,55,0.12)]"
                        : "border border-transparent hover:border-white/10 hover:bg-black/30"
                    )}
                    title={item.label}
                  >
                    <span
                      className={cx(
                        "grid place-items-center h-8 w-8 rounded-xl border",
                        active
                          ? "border-[var(--brand-gold)]/50 bg-black/30 text-[var(--brand-gold)]"
                          : "border-white/10 bg-black/20 text-white/70"
                      )}
                    >
                      {item.icon}
                    </span>

                    {!collapsed ? (
                      <span className={cx(active ? "text-white" : "text-white/80")}>
                        {item.label}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="mt-auto p-3 border-t border-white/10">
              {!collapsed ? (
                <div className="text-xs text-white/50">
                  Tip: Sidebar state is saved automatically.
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-6 py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
