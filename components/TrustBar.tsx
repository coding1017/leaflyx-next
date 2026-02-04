"use client";

import React from "react";
import { ShieldCheck, FlaskConical, Truck, Lock } from "lucide-react";

type Item = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

export default function TrustBar({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "compact";
}) {
  const items: Item[] = [
    {
      icon: <FlaskConical className="h-5 w-5" aria-hidden="true" />,
      title: "Third-party lab tested",
      desc: "COAs available for every batch.",
    },
    {
      icon: <Truck className="h-5 w-5" aria-hidden="true" />,
      title: "Fast, discreet shipping",
      desc: "Secure packaging + tracking.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" aria-hidden="true" />,
      title: "Quality-first sourcing",
      desc: "Curated flower & extracts.",
    },
    {
      icon: <Lock className="h-5 w-5" aria-hidden="true" />,
      title: "Secure checkout",
      desc: "Encrypted payments & data.",
    },
  ];

  const compact = variant === "compact";

  return (
    <section
      aria-label="Trust bar"
      className={[
        "relative",
        "rounded-3xl",
        "border border-white/10",
        "bg-emerald-950/55 backdrop-blur",
        "shadow-[0_18px_70px_rgba(0,0,0,0.45)]",
        "overflow-hidden",
        className,
      ].join(" ")}
    >
      {/* subtle emerald depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,rgba(212,175,55,0.14),transparent_55%)]" />

      {/* top hairline */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className={compact ? "px-4 py-3" : "px-5 py-4"}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-white/70">
            <span className="text-[var(--brand-gold)] font-semibold">Why Leaflyx</span>
            <span className="mx-2 text-white/25">•</span>
            <span>Premium THCA goods backed by verification and care.</span>
          </div>

          {/* tiny glow chip (optional flair) */}
          <div
            className="
              hidden md:inline-flex items-center gap-2
              rounded-full px-3 py-1 text-[11px]
              bg-black/35 text-[var(--brand-gold)]
              ring-1 ring-white/10
              shadow-[0_0_16px_rgba(212,175,55,0.18)]
            "
          >
            Verified experience
          </div>
        </div>

        <div
          className={[
            "mt-3 grid gap-2.5",
            "grid-cols-2",
            "md:grid-cols-4",
          ].join(" ")}
        >
          {items.map((it) => (
            <div
              key={it.title}
              className="
                group relative
                rounded-2xl
                border border-white/10
                bg-black/20
                px-3 py-3
                transition
                hover:bg-black/30
                hover:shadow-[0_0_24px_rgba(212,175,55,0.16)]
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    grid h-9 w-9 place-items-center
                    rounded-2xl
                    bg-black/35
                    text-[var(--brand-gold)]
                    ring-1 ring-white/10
                    shadow-[0_0_12px_rgba(212,175,55,0.14)]
                    transition
                    group-hover:shadow-[0_0_18px_rgba(212,175,55,0.22)]
                  "
                >
                  {it.icon}
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[rgba(212,175,55,0.95)] leading-5">
                    {it.title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/60 leading-4">
                    {it.desc}
                  </div>
                </div>
              </div>

              {/* bottom glow line */}
              <div className="pointer-events-none absolute left-4 right-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.35)] to-transparent opacity-0 group-hover:opacity-100 transition" />
            </div>
          ))}
        </div>
      </div>

      {/* bottom gold strip */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.65)] to-transparent" />
    </section>
  );
}
