"use client";
import { useEffect, useState } from "react";
import { StarRating } from "./StarRating";

export default function ReviewBadge({ productSlug }: { productSlug: string }) {
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!productSlug) return;
    (async () => {
      try {
        const r = await fetch(`/api/reviews/summary?slugs=${encodeURIComponent(productSlug)}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        const entry = j?.data?.[productSlug];
        if (!entry) return;
        setAvg(entry.average);
        setCount(entry.count);
      } catch {
        /* ignore */
      }
    })();
  }, [productSlug]);

  if (!productSlug || avg == null || count === 0) return null;

  return (
    <div className="mt-1 flex items-center gap-2">
      <StarRating value={avg} size={14} />
      <span className="text-xs text-neutral-500">({count})</span>
    </div>
  );
}
