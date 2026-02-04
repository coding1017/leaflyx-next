// components/reviews/ReviewsSummaryStrip.tsx
"use client";

export default function ReviewsSummaryStrip({
  rating,
  reviewCount,
  onClick,
}: {
  rating: number;
  reviewCount: number;
  onClick: () => void;
}) {
  const rounded = Math.round(rating);

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        mt-3 inline-flex items-center gap-2
        text-sm text-white/75 hover:text-white
        transition group
      "
      aria-label={`View reviews: ${rating.toFixed(1)} stars from ${reviewCount} reviews`}
    >
      {/* stars */}
      <span className="inline-flex items-center gap-[2px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className={[
              "h-4 w-4",
              i < rounded ? "text-[var(--brand-gold)]" : "text-white/20",
              i < rounded ? "drop-shadow-[0_0_10px_rgba(212,175,55,0.25)]" : "",
            ].join(" ")}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9L10 14.8 4.8 17.8l1-5.9-4.3-4.2 5.9-.9L10 1.5z" />
          </svg>
        ))}
      </span>

      <span className="font-semibold text-white/90">{rating.toFixed(1)}</span>

      <span className="text-white/50">
        ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
      </span>

      <span className="ml-1 text-[var(--brand-gold)] opacity-0 group-hover:opacity-100 transition">
        View →
      </span>
    </button>
  );
}
