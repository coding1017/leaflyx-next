"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { leaflyxResubscribeConfetti } from "@/lib/confetti";

export default function ResubscribedToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const v = params.get("resubscribed");
    if (v !== "1") return;

    // ✅ show toast + celebrate once
    setOpen(true);
    leaflyxResubscribeConfetti();

    // ✅ remove query param so it doesn't show again on refresh
    const t = setTimeout(() => {
      router.replace(pathname, { scroll: false });
    }, 50);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, pathname]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 3400);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed top-[92px] left-1/2 -translate-x-1/2 z-[80] px-4">
      <div
        className="
          relative overflow-hidden
          rounded-2xl border-[3px] border-[var(--brand-gold)]
          bg-black
          shadow-[0_0_0_1px_rgba(212,175,55,0.25),_0_18px_60px_rgba(0,0,0,0.70)]
        "
        role="status"
        aria-live="polite"
      >
        {/* subtle gold sheen */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_260px_at_20%_-20%,rgba(212,175,55,0.22),transparent_60%)]" />

        <div className="relative flex items-center gap-3 px-4 py-3">
          <div
            className="
              h-9 w-9 rounded-full
              border-2 border-[var(--brand-gold)]
              bg-black/60
              flex items-center justify-center
              shadow-[0_0_18px_rgba(212,175,55,0.25)]
            "
            aria-hidden="true"
          >
            <span className="text-[var(--brand-gold)] text-lg leading-none">✓</span>
          </div>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--brand-gold)]">
              You’re back in.
            </div>
            <div className="text-sm text-white/80">
              Welcome again — you’ll get updates + your promo.
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="
              ml-2 h-9 w-9 shrink-0 rounded-full
              border-2 border-[var(--brand-gold)]
              bg-black/40 hover:bg-black/55
              text-white/90
              transition
            "
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
