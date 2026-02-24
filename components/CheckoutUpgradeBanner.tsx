"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "leaflyx_checkout_upgrade_banner_v8";

// Your requested green
const LEAFLYX_GREEN = "#046307";

// Match your header search bar “cream” feel
const SEARCH_CREAM_BG = "rgba(241, 238, 226, 0.92)";

export default function CheckoutUpgradeBanner() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setDismissed(true);
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
    <div className="relative">
      {/* No hard white divider lines — premium glass slab */}
      <div
        className="relative backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.32), rgba(10,22,16,0.40), rgba(0,0,0,0.32))",
          boxShadow:
            "0 14px 40px rgba(0,0,0,0.35), 0 0 26px rgba(245,215,122,0.10)",
        }}
      >
        {/* Soft gold aura (subtle) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-6rem] -top-14 h-40 w-[28rem] rounded-full bg-[var(--brand-gold)]/14 blur-3xl" />
          <div className="absolute -left-24 -top-14 h-36 w-[22rem] rounded-full bg-emerald-500/8 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          {/* Copy */}
          <div className="min-w-0 flex-1 text-sm leading-snug">
            {success ? (
              <div className="font-semibold text-[var(--brand-gold)]">
                You’re on the list. We’ll email your private launch discount. 🎉
              </div>
            ) : (
              <>
                {/* ROW 1: "Checkout Upgrade" solid gold + gradient starts after */}
                <div className="font-semibold">
                  <span className="text-[var(--brand-gold)]">Checkout Upgrade</span>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      // Gold -> #046307
                      backgroundImage: `linear-gradient(90deg,
                        rgba(245,215,122,0.98) 0%,
                        rgba(245,215,122,0.92) 18%,
                        ${LEAFLYX_GREEN} 92%
                      )`,
                    }}
                  >
                    {" "}
                    in Progress to Improve Security and Speed.
                  </span>{" "}
                  🚀
                </div>

                {/* ROW 2: #046307 -> gold, with MORE gold tail */}
                <div
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(90deg,
                      ${LEAFLYX_GREEN} 0%,
                      rgba(4,99,7,0.92) 30%,
                      rgba(245,215,122,0.70) 58%,
                      rgba(245,215,122,0.92) 82%,
                      rgba(245,215,122,1) 100%
                    )`,
                  }}
                >
                  Enter your email for early access + a private launch discount.
                </div>
              </>
            )}
          </div>

          {/* Desktop form */}
          {!success && (
            <form onSubmit={handleSubmit} className="hidden md:flex items-center gap-2">
              <div className="relative">
                {/* Gold halo ring (subtle) */}
                <div className="pointer-events-none absolute -inset-[2px] rounded-full bg-[var(--brand-gold)]/16 blur-[2px]" />

                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative h-10 w-64 rounded-full px-4 text-sm text-black placeholder:text-black/45
                             focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/35"
                  style={{
                    // ✅ match header search bar vibe
                    background: SEARCH_CREAM_BG,
                    // ✅ gold frame
                    border: "1px solid rgba(245,215,122,0.92)",
                    // ✅ subtle depth
                    boxShadow:
                      "inset 0 0 0 1px rgba(0,0,0,0.12), 0 8px 18px rgba(0,0,0,0.16)",
                  }}
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

          {/* Dismiss (gold) */}
          <button
            onClick={dismiss}
            aria-label="Dismiss banner"
            className="ml-1 grid h-9 w-9 place-items-center rounded-full
                       border border-[var(--brand-gold)]/55
                       text-[var(--brand-gold)] hover:bg-[var(--brand-gold)]/10 transition"
          >
            ✕
          </button>
        </div>

        {/* Mobile form row */}
        {!success && (
          <div className="relative md:hidden px-4 pb-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute -inset-[2px] rounded-full bg-[var(--brand-gold)]/16 blur-[2px]" />
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative h-10 w-full rounded-full px-4 text-sm text-black placeholder:text-black/45
                             focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/35"
                  style={{
                    background: SEARCH_CREAM_BG,
                    border: "1px solid rgba(245,215,122,0.92)",
                    boxShadow:
                      "inset 0 0 0 1px rgba(0,0,0,0.12), 0 8px 18px rgba(0,0,0,0.16)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-10 shrink-0 rounded-full bg-[var(--brand-gold)] px-4 text-sm font-semibold text-black
                           shadow-[0_10px_26px_rgba(245,215,122,0.22)]
                           hover:brightness-110 transition disabled:opacity-70"
              >
                {loading ? "..." : "Get"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}