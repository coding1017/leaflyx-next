// components/checkout/CheckoutClient.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/components/CartContext";
import CheckoutTrustBar from "@/components/checkout/CheckoutTrustBar";
import CheckoutReassurance from "@/components/checkout/CheckoutReassurance";

const usd = (cents: number) =>
  ((cents ?? 0) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function CheckoutClient() {
  const { items, subtotalCents, count } = useCart();

  const empty = !items?.length;

  const lineItems = useMemo(
    () =>
      (items ?? []).map((it) => ({
        key: `${it.id}__${it.variant ?? "∅"}`,
        name: it.name,
        variant: it.variant,
        qty: it.qty,
        priceCents: it.priceCents,
      })),
    [items]
  );

  return (
    <div className="pt-6 pb-12">
      <div className="mb-2 text-xs tracking-wide uppercase text-white/55">Secure checkout</div>

      <h1 className="text-3xl font-semibold">
        <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
          Checkout
        </span>
      </h1>

      <CheckoutTrustBar />

      {empty ? (
        <div
          className="
            mt-8 rounded-3xl p-10 text-center
            border border-dashed border-white/15
            bg-black/20 text-white/65
          "
        >
          Your cart is empty.
          <div className="mt-3">
            <Link
              href="/products"
              className="inline-flex rounded-full px-5 py-2 text-sm font-semibold
                         border border-[var(--brand-gold)] bg-black/40
                         hover:bg-black/55 hover:shadow-[0_0_18px_rgba(212,175,55,0.35)]
                         transition"
            >
              <span className="bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent">
                Continue shopping
              </span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* LEFT: steps (single-page, fewer steps) */}
          <div className="space-y-6">
            {/* Step 1: Review */}
            <section
              className="
                rounded-3xl p-6
                border border-white/10
                bg-black/20
                shadow-[0_18px_60px_rgba(0,0,0,0.35),inset_0_1px_14px_rgba(255,255,255,0.04)]
              "
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  <span className="text-[var(--brand-gold)]">1.</span>{" "}
                  <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
                    Review your order
                  </span>
                </h2>
                <Link href="/cart" className="text-sm text-white/65 underline hover:no-underline">
                  Edit cart
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {lineItems.map((it) => (
                  <div
                    key={it.key}
                    className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-white/85 truncate">{it.name}</div>
                      <div className="text-xs text-white/55">
                        {it.variant ? `Variant: ${it.variant} · ` : ""}Qty: {it.qty}
                      </div>
                    </div>
                    <div className="text-sm text-white/70">{usd(it.priceCents * it.qty)}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Step 2: Payment placeholder */}
            <section
              className="
                rounded-3xl p-6
                border border-white/10
                bg-black/20
                shadow-[0_18px_60px_rgba(0,0,0,0.35),inset_0_1px_14px_rgba(255,255,255,0.04)]
              "
            >
              <h2 className="text-lg font-semibold">
                <span className="text-[var(--brand-gold)]">2.</span>{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
                  Payment
                </span>
              </h2>

              <div className="mt-3 text-sm text-white/70">
                Payment provider is being finalized. This section will become a secure payment form
                (card / wallet) as soon as your processor is ready.
              </div>

              <button
                type="button"
                disabled
                className="
                  mt-5 w-full rounded-full px-5 py-3 text-sm font-semibold
                  bg-[var(--brand-gold)] text-black
                  opacity-60 cursor-not-allowed
                  shadow-[0_0_0_1px_rgba(0,0,0,0.65)]
                "
              >
                Place order (disabled until payments are live)
              </button>

              <div className="mt-3 text-xs text-white/55">
                Your cart is saved — you can come back anytime.
              </div>
            </section>

            <CheckoutReassurance />
          </div>

          {/* RIGHT: summary */}
          <aside
            className="
              h-fit rounded-3xl p-6
              border border-white/10
              bg-black/25 backdrop-blur-md
              shadow-[0_18px_60px_rgba(0,0,0,0.35),inset_0_1px_14px_rgba(255,255,255,0.04)]
            "
          >
            <div className="text-sm text-white/65">Order summary</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-white/80">Items</div>
              <div className="text-white/80">{count}</div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="text-white/80">Subtotal</div>
              <div className="text-white/80">{usd(subtotalCents)}</div>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4 flex items-center justify-between">
              <div className="font-semibold text-white/90">Total</div>
              <div className="font-semibold text-white/90">{usd(subtotalCents)}</div>
            </div>

            <div className="mt-4 text-xs text-white/55">
              Taxes & shipping (if applicable) will be calculated once payments are live.
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
