// components/checkout/CheckoutReassurance.tsx
"use client";

export default function CheckoutReassurance() {
  return (
    <div
      className="
        mt-4 rounded-3xl p-5
        border border-white/10
        bg-black/20
        shadow-[0_18px_60px_rgba(0,0,0,0.35),inset_0_1px_14px_rgba(255,255,255,0.04)]
      "
    >
      <h3 className="text-base font-semibold">
        <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
          What to expect
        </span>
      </h3>

      <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/75">
        <p>
          <span className="text-[var(--brand-gold)] font-semibold">Lab-tested transparency:</span>{" "}
          COAs are available on product pages so you can verify cannabinoid content before purchase.
        </p>

        <p>
          <span className="text-[var(--brand-gold)] font-semibold">Shipping clarity:</span>{" "}
          You’ll receive an order confirmation immediately, and tracking once your package is scanned by the carrier.
        </p>

        <p className="text-xs text-white/60">
          Not legal advice. Hemp legality can vary by state and local rules. Always review local regulations.
        </p>
      </div>
    </div>
  );
}
