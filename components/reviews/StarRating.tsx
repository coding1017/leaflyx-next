"use client";
import { Star } from "lucide-react";

export function StarRating({ value, size = 18 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <Star
            key={i}
            size={size}
            className={filled ? "fill-current" : ""}
            style={{ color: "var(--brand-gold)" }}
          />
        );
      })}
      <span className="text-sm text-neutral-500 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}
