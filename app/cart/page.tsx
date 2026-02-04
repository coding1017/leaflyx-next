// app/cart/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartContext";

type DiscountMeta = {
  code: string;
  type: "PERCENT" | "AMOUNT";
  percentOff?: number | null;
  amountOffCents?: number | null;
  description?: string | null;
  ambassadorLabel?: string | null;
};

const DISCOUNT_KEY = "leaflyx_discount_code";
const DISCOUNT_META_KEY = "leaflyx_discount_meta_v1";

function money(cents: number) {
  const n = Number.isFinite(cents) ? cents : 0;
  return (n / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function CartPage() {
  const { items, inc, dec, remove, subtotalCents } = useCart();

  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);

  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);

  const [discountMeta, setDiscountMeta] = useState<DiscountMeta | null>(null);
  const [discountCents, setDiscountCents] = useState(0);

  // Offline banner (for checkout button)
  const [offlineOpen, setOfflineOpen] = useState(false);

  // ✅ NEW: Subscribe form state (NOTICE modal only)
  const [subEmail, setSubEmail] = useState("");
  const [subBusy, setSubBusy] = useState(false);
  const [subMsg, setSubMsg] = useState<string | null>(null);
  const [subErr, setSubErr] = useState<string | null>(null);

  // ---- hydrate saved code/meta ----
  useEffect(() => {
    try {
      const rawCode = window.localStorage.getItem(DISCOUNT_KEY);
      const rawMeta = window.localStorage.getItem(DISCOUNT_META_KEY);

      if (rawMeta) {
        const meta = JSON.parse(rawMeta) as DiscountMeta;
        if (meta?.code) {
          setDiscountMeta(meta);
          setCodeInput(meta.code);
        }
      } else if (rawCode) {
        setCodeInput(String(rawCode));
      }
    } catch {
      // ignore
    }
  }, []);

  // snapshot items for validation API
  const snapItems = useMemo(
    () =>
      items.map((i) => ({
        id: i.id,
        name: i.name,
        variant: i.variant ?? null,
        priceCents: i.priceCents,
        qty: i.qty,
      })),
    [items]
  );

  const validateAndSet = useCallback(
    async (codeRaw: string) => {
      const code = (codeRaw ?? "").trim().toUpperCase();

      if (!code) {
        setPromoErr("Enter a code.");
        setPromoMsg(null);
        setDiscountMeta(null);
        setDiscountCents(0);
        try {
          window.localStorage.removeItem(DISCOUNT_KEY);
          window.localStorage.removeItem(DISCOUNT_META_KEY);
          window.localStorage.removeItem("leaflyx_discount_code"); // legacy safety
        } catch {}
        return;
      }

      setBusy(true);
      setPromoErr(null);
      setPromoMsg(null);

      try {
        const res = await fetch("/api/discounts/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            subtotalCents,
            items: snapItems,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          const msg = data?.error || "Invalid code.";
          setPromoErr(msg);
          setPromoMsg(null);

          setDiscountMeta(null);
          setDiscountCents(0);

          try {
            window.localStorage.removeItem(DISCOUNT_KEY);
            window.localStorage.removeItem(DISCOUNT_META_KEY);
            window.localStorage.removeItem("leaflyx_discount_code");
          } catch {}
          return;
        }

        const meta: DiscountMeta = {
          code: data.code,
          type: data.type,
          percentOff: data.percentOff ?? null,
          amountOffCents: data.amountOffCents ?? null,
          description: data.description ?? null,
          ambassadorLabel: data.ambassadorLabel ?? null,
        };

        setDiscountMeta(meta);
        setDiscountCents(Number(data.discountCents ?? 0));
        setPromoMsg(`Applied: ${meta.code}`);
        setPromoErr(null);

        try {
          window.localStorage.setItem(DISCOUNT_KEY, meta.code);
          window.localStorage.setItem(DISCOUNT_META_KEY, JSON.stringify(meta));
        } catch {}
      } catch {
        setPromoErr("Could not validate code. Try again.");
        setPromoMsg(null);
      } finally {
        setBusy(false);
      }
    },
    [snapItems, subtotalCents]
  );

  // re-validate saved code any time cart changes (keeps totals synced)
  useEffect(() => {
    if (!discountMeta?.code) return;
    if (!snapItems.length || subtotalCents <= 0) {
      setDiscountCents(0);
      return;
    }
    validateAndSet(discountMeta.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapItems, subtotalCents]);

  function removeCode() {
    setDiscountMeta(null);
    setDiscountCents(0);
    setPromoMsg(null);
    setPromoErr(null);
    setCodeInput("");

    try {
      window.localStorage.removeItem(DISCOUNT_KEY);
      window.localStorage.removeItem(DISCOUNT_META_KEY);
      window.localStorage.removeItem("leaflyx_discount_code");
    } catch {}
  }

  const totalCents = Math.max(0, subtotalCents - discountCents);
  const hasItems = items.length > 0;

  // ✅ NEW: subscribe handler (posts to /api/subscribe you already tested)
  const submitSubscribe = useCallback(async () => {
    const email = subEmail.trim();
    if (!email) {
      setSubErr("Enter your email.");
      setSubMsg(null);
      return;
    }

    setSubBusy(true);
    setSubErr(null);
    setSubMsg(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setSubErr(data?.error || "Could not subscribe. Try again.");
        setSubMsg(null);
        return;
      }

      setSubMsg("Subscribed — check your email.");
      setSubErr(null);
      setSubEmail("");
    } catch {
      setSubErr("Network error. Try again.");
      setSubMsg(null);
    } finally {
      setSubBusy(false);
    }
  }, [subEmail]);

    // --- Leaflyx “smokey glass” helpers (pure gold lines) ---
  const CARD =
    `
    rounded-3xl
    border-[3px] border-[var(--brand-gold)]
    bg-black
    shadow-[0_0_0_1px_rgba(212,175,55,0.28),_0_30px_90px_rgba(0,0,0,0.70)]
    overflow-hidden
    relative
  `;


  const DIVIDER = `border-t-[3px] border-[var(--brand-gold)]`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-white">
      {/* Title */}
      <h1 className="text-3xl font-semibold tracking-tight">
        <span className="text-[var(--brand-gold)] drop-shadow-[0_0_16px_rgba(212,175,55,0.35)]">
          Cart
        </span>
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        {/* LEFT: items */}
        <section className={CARD}>
          {/* subtle inner sheen */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(212,175,55,0.18),transparent_60%)]" />

          {!hasItems ? (
            <div className="relative p-8">
              <p className="text-white/70">Your cart is empty.</p>
              <Link
                href="/shop"
                className="
                  mt-4 inline-flex items-center justify-center
                  rounded-full px-4 py-2 text-sm font-semibold
                  bg-[var(--brand-gold)] text-black
                  hover:brightness-105
                  shadow-[0_10px_30px_rgba(212,175,55,0.25)]
                  transition
                "
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="relative">
              {items.map((i, idx) => (
                <div
                  key={`${i.id}:${i.variant ?? ""}:${idx}`}
                  className={`p-6 ${idx === 0 ? "" : DIVIDER}`}
                >
                  <div className="flex gap-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white/10 ring-2 ring-[var(--brand-gold)]">
                      {i.image ? (
                        <Image
                          src={i.image}
                          alt={i.name}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">
                            <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
                              {i.name}
                            </span>{" "}
                            {i.variant ? (
                              <span className="text-white/55">— {i.variant}</span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-sm text-white/55">
                            {money(i.priceCents)} each
                          </div>
                        </div>

                        <div className="shrink-0 text-lg font-semibold">
                          {money(i.priceCents * i.qty)}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => dec(i.id, i.variant ?? null)}
                          className="
                            h-9 w-9 rounded-full
                            border-2 border-[var(--brand-gold)]
                            bg-black/35
                            hover:bg-black/50
                            transition
                          "
                          aria-label="Decrease quantity"
                        >
                          –
                        </button>

                        <div
                          className="
                            min-w-[44px] text-center
                            rounded-full px-3 py-1.5
                            border-2 border-[var(--brand-gold)]
                            bg-black/30
                            font-semibold
                          "
                        >
                          {i.qty}
                        </div>

                        <button
                          onClick={() => inc(i.id, i.variant ?? null)}
                          className="
                            h-9 w-9 rounded-full
                            border-2 border-[var(--brand-gold)]
                            bg-black/35
                            hover:bg-black/50
                            transition
                          "
                          aria-label="Increase quantity"
                        >
                          +
                        </button>

                        <button
                          onClick={() => remove(i.id, i.variant ?? null)}
                          className="
                            ml-2 text-sm font-semibold
                            text-rose-300/90 hover:text-rose-200
                            underline underline-offset-4
                            transition
                          "
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT: promo + summary */}
        <aside className="space-y-6">
          {/* Promo */}
          <section className={CARD}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_80%_-10%,rgba(212,175,55,0.16),transparent_60%)]" />

            <div className="relative flex items-center justify-between p-5">
              <h2 className="text-base font-semibold">Promo code</h2>

              {discountMeta?.code ? (
                <button
                  onClick={removeCode}
                  className="
                    rounded-full px-4 py-2 text-sm font-semibold
                    border-2 border-[var(--brand-gold)]
                    bg-black/35
                    hover:bg-black/50
                    transition
                  "
                >
                  Remove
                </button>
              ) : (
                <button
                  type="submit"
                  form="promo-form"
                  disabled={busy || !codeInput.trim()}
                  className="
                    rounded-full px-5 py-2 text-sm font-semibold
                    bg-[var(--brand-gold)] text-black
                    hover:brightness-105
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-[0_10px_26px_rgba(212,175,55,0.28)]
                    transition
                  "
                >
                  {busy ? "Applying…" : "Apply"}
                </button>
              )}
            </div>

            {/* Form enables Enter/Return to Apply */}
            <form
              id="promo-form"
              className="relative px-5 pb-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (discountMeta?.code) return; // already applied
                validateAndSet(codeInput);
              }}
            >
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter code"
                className="
                  w-full rounded-full px-4 py-2
                  bg-black/45
                  border-2 border-[var(--brand-gold)]
                  focus:outline-none
                  focus:shadow-[0_0_0_3px_rgba(212,175,55,0.22)]
                  transition
                "
              />

              {promoErr ? (
                <div className="mt-2 text-sm text-rose-300">{promoErr}</div>
              ) : promoMsg ? (
                <div className="mt-2 text-sm text-[var(--brand-gold)]">{promoMsg}</div>
              ) : null}
            </form>
          </section>

          {/* Summary */}
          <section className={CARD}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_20%_-10%,rgba(212,175,55,0.14),transparent_62%)]" />

            <div className="relative p-5">
              <h2 className="text-base font-semibold text-[var(--brand-gold)]">
                Summary
              </h2>
            </div>

            <div className={`relative ${DIVIDER} px-5 py-4 space-y-3`}>
              <div className="flex items-center justify-between text-white/80">
                <span>Subtotal</span>
                <span className="font-semibold text-white">{money(subtotalCents)}</span>
              </div>

              <div className="flex items-center justify-between text-white/80">
                <span>Discount</span>
                <span className="font-semibold text-[var(--brand-gold)]">
                  -{money(discountCents)}
                </span>
              </div>

              <div className={`pt-3 ${DIVIDER} flex items-end justify-between`}>
                <span className="text-white/85 font-semibold">Total</span>
                <span className="text-3xl font-semibold tracking-tight">
                  {money(totalCents)}
                </span>
              </div>

              <button
                type="button"
                disabled={!hasItems}
                onClick={() => {
                  // reset subscribe UI each open (keeps it feeling clean)
                  setSubMsg(null);
                  setSubErr(null);
                  setOfflineOpen(true);
                }}
                className="
                  mt-4 w-full rounded-full py-3 font-semibold text-black
                  bg-[var(--brand-gold)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-[0_0_0_2px_rgba(212,175,55,0.25),_0_0_28px_rgba(212,175,55,0.60),_0_18px_60px_rgba(212,175,55,0.25)]
                  hover:brightness-105
                  transition
                "
              >
                Checkout
              </button>

              <Link
                href="/shop"
                className="mt-3 inline-block text-sm text-white/70 hover:text-white underline underline-offset-4"
              >
                Continue shopping
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {/* Offline banner */}
      {offlineOpen ? (
        <div className="fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOfflineOpen(false)}
          />

          {/* ✅ moved DOWN so it doesn't collide with header */}
          <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[min(760px,calc(100vw-32px))]">
            <div
              className="
                relative overflow-hidden rounded-3xl
                border-[3px] border-[var(--brand-gold)]
                bg-[linear-gradient(180deg,rgba(8,8,8,0.86),rgba(0,0,0,0.62))]
                shadow-[0_0_0_1px_rgba(212,175,55,0.22),_0_25px_80px_rgba(0,0,0,0.70)]
              "
            >
              {/* smokey / gold sheen */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_20%_-10%,rgba(212,175,55,0.20),transparent_60%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_85%_30%,rgba(16,185,129,0.12),transparent_55%)]" />

              <div className="relative p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--brand-gold)]">
                      Notice
                    </div>

                    {/* ✅ updated copy */}
                    <div className="mt-2 text-white/90 leading-relaxed">
                      Our apology while our site is offline. Subscribe below for email updates with a
                      special promo codes for the inconvenience and latest news
                    </div>

                    {/* ✅ subscribe form (Enter/Return submits) */}
                    <form
                      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!subBusy) submitSubscribe();
                      }}
                    >
                      <input
                        value={subEmail}
                        onChange={(e) => setSubEmail(e.target.value)}
                        placeholder="you@email.com"
                        inputMode="email"
                        className="
                          w-full rounded-full px-4 py-2.5
                          bg-black/55
                          border-2 border-[var(--brand-gold)]
                          text-white placeholder:text-white/45
                          focus:outline-none
                          focus:shadow-[0_0_0_3px_rgba(212,175,55,0.22)]
                          transition
                        "
                      />

                      <button
                        type="submit"
                        disabled={subBusy}
                        className="
                          inline-flex items-center justify-center
                          rounded-full px-5 py-2.5 text-sm font-semibold
                          bg-[var(--brand-gold)] text-black
                          hover:brightness-105
                          disabled:opacity-50 disabled:cursor-not-allowed
                          shadow-[0_10px_26px_rgba(212,175,55,0.28)]
                          transition
                          w-full sm:w-auto
                        "
                      >
                        {subBusy ? "Subscribing…" : "Subscribe"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setOfflineOpen(false)}
                        className="
                          inline-flex items-center justify-center
                          rounded-full px-5 py-2.5 text-sm font-semibold
                          border-2 border-[var(--brand-gold)]
                          bg-black/40
                          hover:bg-black/55
                          transition
                          w-full sm:w-auto
                        "
                      >
                        Close
                      </button>
                    </form>

                    {subErr ? (
                      <div className="mt-2 text-sm text-rose-300">{subErr}</div>
                    ) : subMsg ? (
                      <div className="mt-2 text-sm text-[var(--brand-gold)]">{subMsg}</div>
                    ) : null}

                    {/* optional secondary link you had before */}
                    <div className="mt-4">
                      <Link
                        href="/account"
                        className="text-sm text-white/70 hover:text-white underline underline-offset-4"
                      >
                        Account
                      </Link>
                    </div>
                  </div>

                  <button
                    onClick={() => setOfflineOpen(false)}
                    className="
                      h-10 w-10 shrink-0 rounded-full
                      border-2 border-[var(--brand-gold)]
                      bg-black/40
                      hover:bg-black/55
                      transition
                      text-white
                    "
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="relative border-t-[3px] border-[var(--brand-gold)] px-5 py-3 text-xs text-white/60">
                Leaflyx • Premium THCA goods
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
