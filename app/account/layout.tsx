// app/account/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import LogoutLink from "@/components/account/LogoutLink";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-white">
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Your account</h1>
          <p className="mt-1 text-white/70">
            Private by default. You control what (if anything) becomes public.
          </p>
        </div>

        {/* Mood-style: Not you? Logout */}
        <div className="shrink-0">
          <LogoutLink />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <nav className="space-y-1">
            <NavItem href="/account" label="Overview" />
            <NavItem href="/account/orders" label="My orders" />
            <NavItem href="/account/settings" label="Settings" />
          </nav>

          <div className="mt-4 border-t border-white/10 pt-4 text-xs text-white/55">
            Account pages are not indexed by search engines.
          </div>
        </aside>

        {/* Page content */}
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="
        group relative flex items-center justify-between
        rounded-xl px-4 py-2
        bg-black/30 border border-white/10
        text-white/85
        hover:bg-black/45
        hover:border-[#F5D77A]/40
        hover:shadow-[0_0_18px_rgba(245,215,122,0.18)]
        transition
      "
    >
      <span>{label}</span>
      <span className="text-white/40 group-hover:text-[#F5D77A]/80 transition">›</span>
    </Link>
  );
}
