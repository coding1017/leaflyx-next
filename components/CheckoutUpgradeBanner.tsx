"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "leaflyx_checkout_upgrade_banner_dismissed_v2";

export default function CheckoutUpgradeBanner() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setDismissed(true);
    } catch {}
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;

    try {
      setLoading(true);
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });

      if (res.ok) {
        setSuccess(true);
        setEmail("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (dismissed) return null;

  return (
    <div className="relative z-[60]">
      {/* Smokey emerald/gold glass backdrop */}
      <div className="border-b border-[var(--brand-gold)]/60 bg-black/30 backdrop-blur-xl">
        {/* subtle emerald→gold aura, very Leaflyx */}
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-24 -top-16 h-40 w-80 rounded-full bg-emerald-500/18 blur-3xl" />
          <div className="absolute right-0 -top-10 h-44 w-80 rounded-full bg-[var(--brand-gold)]/18 blur-3xl" />
        </div>

        {/* top glow line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--brand-gold)]/55 shadow-[0_0_26px_rgba(245,215,122,0.18)]" />

        <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          {/* Copy */}
          <div className="min-w-0 flex-1">
            {success ? (
              <p className="text-sm font-semibold text-[var(--brand-gold)]">
                You’re on the list. We’ll email your private launch discount. 🎉
              </p>
            ) : (
              <p className="text-sm leading-snug">
                <span className="font-semibold text-[var(--brand-gold)]">
                  Checkout Upgrade in Progress 🚀
                </span>
                <span className="text-emerald-100/85">
                  {" "}
                  We’re switching payment processors to improve security and speed.
                </span>
                <span className="text-[var(--brand-gold)]/85">
                  {" "}
                  Enter your email for early access + a private launch discount.
                </span>
              </p>
            )}
          </div>

          {/* Desktop form (single row) */}
          {!success && (
            <form onSubmit={handleSubmit} className="hidden md:flex items-center gap-2">
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 rounded-full border border-[var(--brand-gold)]/35 shadow-[0_0_26px_rgba(16,185,129,0.10)]" />
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-64 rounded-full bg-black/25 px-4 text-sm text-emerald-50 placeholder:text-emerald-100/40
                             border border-[var(--brand-gold)]/60
                             focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/45"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-full bg-[var(--brand-gold)] px-4 text-sm font-semibold text-black
                           shadow-[0_10px_26px_rgba(245,215,122,0.22)]
                           hover:brightness-110 transition disabled:opacity-70"
              >
                {loading ? "..." : "Get Access"}
              </button>
            </form>
          )}

          {/* Dismiss */}
          <button
            onClick={dismiss}
            aria-label="Dismiss banner"
            className="ml-1 grid h-9 w-9 place-items-center rounded-full
                       border border-[var(--brand-gold)]/55
                       text-[var(--brand-gold)]/90
                       hover:bg-[var(--brand-gold)]/10 transition"
          >
            ✕
          </button>
        </div>

        {/* Mobile form row */}
        {!success && (
          <div className="relative md:hidden px-4 pb-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 flex-1 rounded-full bg-black/25 px-4 text-sm text-emerald-50 placeholder:text-emerald-100/40
                           border border-[var(--brand-gold)]/60
                           focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/45"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-10 shrink-0 rounded-full bg-[var(--brand-gold)] px-4 text-sm font-semibold text-black
                           shadow-[0_10px_26px_rgba(245,215,122,0.22)]
                           hover:brightness-110 transition disabled:opacity-70"
              >
                {loading ? "..." : "Get Access"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}