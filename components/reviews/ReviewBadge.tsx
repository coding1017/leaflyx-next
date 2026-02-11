// components/reviews/ReviewBadge.tsx
"use client";

import { useEffect, useState } from "react";
import { StarRating } from "./StarRating";
import { getReviewSummary } from "./reviewSummaryClient";

export default function ReviewBadge({ productSlug }: { productSlug: string }) {
  const slug = String(productSlug || "").trim();
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!slug) return;

    let alive = true;

    (async () => {
      const summary = await getReviewSummary(slug);
      if (!alive) return;

      if (!summary || summary.count <= 0) {
        // keep hidden if no reviews
        setAvg(null);
        setCount(0);
        return;
      }

      setAvg(summary.average);
      setCount(summary.count);
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  if (!slug || avg == null || count === 0) return null;

  return (
    <div className="mt-1 flex items-center gap-2">
      <StarRating value={avg} size={14} />
      <span className="text-xs text-neutral-500">({count})</span>
    </div>
  );
}
