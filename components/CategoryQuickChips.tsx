// components/CategoryQuickChips.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const chips = [
  // Edibles quick-filters
  { label: "Gummies",   href: "/shop/edibles?filters=gummies&match=any" },
  { label: "Brownies",  href: "/shop/edibles?filters=brownies&match=any" },
  { label: "Tinctures", href: "/shop/edibles?filters=tinctures&match=any" },
  { label: "Cookies",   href: "/shop/edibles?filters=cookies&match=any" },

  // Flower quick-filters
  { label: "Organic", href: "/shop/flower?filters=organic&match=all" },
  { label: "Indoor",  href: "/shop/flower?filters=indoor&match=all" },
  { label: "No-till", href: "/shop/flower?filters=no-till&match=all" },
  { label: "Exotic",  href: "/shop/flower?filters=exotic&match=all" },

  // Concentrates quick-filters
  { label: "Hash Rosin",  href: "/shop/concentrates?filters=hash-rosin&match=any" },
  { label: "Live Resin",  href: "/shop/concentrates?filters=live-resin&match=any" },
  { label: "Bubble Hash", href: "/shop/concentrates?filters=bubble-hash&match=any" },
];

export default function CategoryQuickChips() {
  const pathname = usePathname(); // e.g., /shop/edibles
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {chips.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="rounded-full border border-[var(--brand-gold)]/60 px-3 py-1.5 text-sm hover:bg-[var(--brand-gold)] hover:text-black transition"
        >
          {c.label}
        </Link>
      ))}
    </div>
  );
}
