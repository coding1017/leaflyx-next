// components/trust/WhatIsTHCA.tsx
"use client";

import * as React from "react";

type Props = {
  className?: string;
  /** Optional: show a product-specific note (ex: "This product’s COA is linked above.") */
  note?: React.ReactNode;
  /** Optional: override title */
  title?: string;
};

export default function WhatIsTHCA({
  className = "",
  note,
  title = "What is THCA?",
}: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <section
      className={[
        "mt-6 rounded-2xl border border-white/10 bg-black/30 backdrop-blur",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.35)]",
        className,
      ].join(" ")}
      aria-label="THCA education"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full flex items-center justify-between gap-4 px-4 py-4 text-left",
          "hover:bg-white/5 transition rounded-2xl",
        ].join(" ")}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h3 className="text-sm sm:text-[15px] font-semibold tracking-wide">
            <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">
              {title}
            </span>
          </h3>
          <p className="mt-1 text-xs sm:text-[13px] text-white/70">
            Quick clarity on what it is and why it can be sold legally.
          </p>
        </div>

        <span
          className={[
            "shrink-0 inline-flex items-center justify-center",
            "h-9 w-9 rounded-full border border-white/10 bg-black/40",
            "hover:border-[var(--brand-gold)]/40 transition",
          ].join(" ")}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            className={[
              "h-5 w-5 transition-transform duration-200",
              open ? "rotate-180" : "rotate-0",
            ].join(" ")}
          >
            <path
              fill="currentColor"
              className="text-white/80"
              d="M12 15.5a1 1 0 0 1-.7-.29l-6-6a1 1 0 1 1 1.4-1.42L12 13.1l5.3-5.3a1 1 0 0 1 1.4 1.42l-6 6a1 1 0 0 1-.7.28Z"
            />
          </svg>
        </span>
      </button>

      {/* Collapsible body */}
      <div
        className={[
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 text-sm text-white/80 leading-relaxed">
            <p>
              <span className="font-semibold text-white">THCA</span> (tetrahydrocannabinolic acid)
              is a naturally occurring cannabinoid found in raw hemp flower. On its own, THCA is{" "}
              <span className="font-semibold text-white">non-intoxicating</span>. When heated
              (smoked, vaped, or baked), THCA can convert into THC through a process called{" "}
              <span className="font-semibold text-white">decarboxylation</span>.
            </p>

            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-white/85">
                <span className="font-semibold text-white">Legality clarity:</span> Many hemp
                products are sold based on their compliance with the{" "}
                <span className="font-semibold text-white">2018 Farm Bill</span> definition of hemp
                (≤ 0.3% Δ9-THC by dry weight). Legality can vary by state and local rules.
              </p>
            </div>

            <p className="mt-3 text-white/70 text-xs">
              Not legal advice. Always review your local regulations. We provide third-party COAs so
              you can verify cannabinoid content.
            </p>

            {note ? <div className="mt-3 text-white/75">{note}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
