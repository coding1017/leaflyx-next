"use client";
import { useEffect, useState } from "react";
import { StarRating } from "./StarRating";

type Props = {
  productSlug: string;
};

export default function ReviewSummary({ productSlug }: Props) {
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await fetch(`/api/reviews?slug=${encodeURIComponent(productSlug)}`, { cache: "no-store" });
      const j = await r.json();
      if (!alive) return;
      setAvg(j.average || 0);
      setCount(j.total || 0);
    })();
    return () => { alive = false; };
  }, [productSlug]);

  if (count === 0) return null; // hide until you have reviews

  return (
    <div className="mt-2 flex items-center gap-4">
      <StarRating value={avg} />
      <a href="#reviews" className="text-sm underline">
        {count} review{count === 1 ? "" : "s"}
      </a>
      <a href="#write-review" className="text-sm text-neutral-400 hover:underline">
        Write a review
      </a>
    </div>
  );
}
