// components/checkout/CheckoutTrustBar.tsx
"use client";

import { ShieldCheck, Truck, BadgeCheck, Lock } from "lucide-react";

function Pill({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div
      className="
        flex items-start gap-3
        rounded-3xl px-4 py-3
        border border-white/10
        bg-black/25 backdrop-blur
        shadow-[0_16px_50px_rgba(0,0,0,0.35),inset_0_1px_10px_rgba(255,255,255,0.04)]
      "
    >
      <div
        className="
          mt-0.5 flex h-9 w-9 items-center justify-center
          rounded-2xl border border-[rgba(212,175,55,0.35)]
          bg-black/40
          shadow-[0_0_18px_rgba(212,175,55,0.18)]
          text-[var(--brand-gold)]
        "
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white/85">{title}</div>
        <div className="text-xs text-white/60 leading-snug">{sub}</div>
      </div>
    </div>
  );
}

export default function CheckoutTrustBar() {
  return (
    <section className="mt-5 grid gap-3 md:grid-cols-2">
      <Pill
        icon={<BadgeCheck className="h-5 w-5" />}
        title="COA verified"
        sub="Third-party lab results available for every product."
      />
      <Pill
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Quality-first sourcing"
        sub="Curated, premium inventory — no mystery products."
      />
      <Pill
        icon={<Lock className="h-5 w-5" />}
        title="Secure checkout"
        sub="Encrypted payment flow — provider-backed security."
      />
      <Pill
        icon={<Truck className="h-5 w-5" />}
        title="Fast shipping updates"
        sub="Clear tracking + status notifications after order."
      />
    </section>
  );
}
