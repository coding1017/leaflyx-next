"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const TABS = [
  { href: "/admin/emails/restock", label: "Restock" },
  { href: "/admin/emails/password-resets", label: "Password resets" },
  { href: "/admin/emails/subscribers", label: "Subscribers" },
];

export default function EmailsTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-white/60">
            <span className="text-[var(--brand-gold)]">Emails</span>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white/80">
              {TABS.find((t) => pathname?.startsWith(t.href))?.label ?? "Queue"}
            </span>
          </div>

          <h1 className="mt-1 text-3xl font-semibold">Emails</h1>
          <p className="mt-2 text-white/60">
            Manage email-related queues: restock, password resets, subscribers.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm border transition",
                active
                  ? "border-[var(--brand-gold)]/60 bg-[rgba(212,175,55,0.10)] text-white shadow-[0_0_18px_rgba(212,175,55,0.16)]"
                  : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.05] hover:text-white"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
