// components/ShippingExpectations.tsx
"use client";

export default function ShippingExpectations({
  className = "",
}: {
  className?: string;
}) {
  const grad =
    "bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent";

  return (
    <div
      className={[
        `
        mt-3
        inline-flex flex-wrap items-center gap-x-2 gap-y-1
        rounded-xl
        bg-black/50
        border border-[var(--brand-gold)]
        px-3 py-2
        backdrop-blur
        shadow-[0_0_0_1px_rgba(212,175,55,0.35),0_0_18px_rgba(212,175,55,0.25)]
        `,
        className,
      ].join(" ")}
    >
      {/* Segment 1 */}
      <span className={`text-xs font-semibold ${grad}`}>Ships within</span>
      <span className="text-xs font-semibold text-[var(--brand-gold)]">
        24–48 hours
      </span>

      {/* Gold dot (real gold) */}
      <span className="text-xs text-[var(--brand-gold)] opacity-70">•</span>

      {/* Segment 2 */}
      <span className={`text-xs font-semibold ${grad}`}>Discreet packaging</span>

      {/* Gold dot (real gold) */}
      <span className="text-xs text-[var(--brand-gold)] opacity-70">•</span>

      {/* Segment 3 */}
      <span className={`text-xs font-semibold ${grad}`}>Trackable</span>
    </div>
  );
}
