// components/reviews/Reviews.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { StarRating } from "./StarRating";

type Review = {
  id: number;
  productSlug: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
};

type Sort = "recent" | "highest" | "lowest" | "helpful";

type Props = {
  productSlug: string;

  /**
   * ✅ Optional: lets ProductDetailClient show the Reviews Summary Strip
   * using real aggregates (avg rating + total review count) without fetching twice.
   */
  onStats?: (stats: { avgRating: number; reviewCount: number }) => void;
};

export default function Reviews({ productSlug, onStats }: Props) {
  const [items, setItems] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<Sort>("recent");
  const [histogram, setHistogram] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  const [avg, setAvg] = useState(0);

  // ✅ Keep callback stable to avoid update-depth loops
  const onStatsRef = useRef<Props["onStats"]>(onStats);
  useEffect(() => {
    onStatsRef.current = onStats;
  }, [onStats]);

  async function load() {
    const r = await fetch(
      `/api/reviews?slug=${encodeURIComponent(productSlug)}&page=${page}&perPage=${perPage}&sort=${sort}`,
      { cache: "no-store" }
    );
    const j = await r.json();

    const nextItems = (j.items || []) as Review[];
    const nextTotal = Number(j.total || 0);
    const nextHistogram =
      (j.histogram as Record<number, number>) || {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };
    const nextAvg = Number(j.average || 0);

    setItems(nextItems);
    setTotal(nextTotal);
    setHistogram(nextHistogram);
    setAvg(nextAvg);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, productSlug]);

  // Refresh after a form submit elsewhere
  useEffect(() => {
    function onSubmitted(e: any) {
      if (e?.detail?.slug === productSlug) load();
    }
    window.addEventListener("leaflyx:review:submitted", onSubmitted as EventListener);
    return () =>
      window.removeEventListener("leaflyx:review:submitted", onSubmitted as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total, perPage]);

  // ✅ Notify parent with aggregates ONLY when avg/total change
  useEffect(() => {
    const cb = onStatsRef.current;
    if (!cb) return;

    const safeAvg = Number.isFinite(avg) ? Math.max(0, Math.min(5, avg)) : 0;
    const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;

    cb({ avgRating: safeAvg, reviewCount: safeTotal });
  }, [avg, total]);

  async function markHelpful(id: number) {
    const r = await fetch(`/api/reviews/${id}/helpful`, { method: "POST" });
    const j = await r.json();
    if (j?.ok) {
      // Optimistic bump: +1 locally
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, helpfulCount: it.helpfulCount + 1 } : it))
      );
    } else if (j?.alreadyVoted) {
      alert("You already marked this helpful today.");
    } else {
      alert("Could not mark helpful. Please try again.");
    }
  }

  async function flagReview(id: number) {
    const reason = prompt("Reason? (spam, abuse, off-topic)") || "other";
    const details = prompt("Details (optional):") || "";
    const res = await fetch(`/api/reviews/${id}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details }),
    });
    if (res.ok) {
      alert("Thanks! We'll review this.");
    } else {
      alert("Could not flag this review. Please try again.");
    }
  }

  return (
    <section className="mt-10">
      {/* Aggregate */}
      <div className="grid md:grid-cols-3 gap-6 items-center">
        <div>
          <h2 className="text-2xl font-semibold">Customer reviews</h2>
          <div className="mt-2">
            <StarRating value={avg || 0} />
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            {total} review{total === 1 ? "" : "s"}
          </p>
        </div>

        <div className="md:col-span-2">
          {/* Histogram */}
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = histogram[star] || 0;
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-10 text-sm">{star}★</span>
                  <div className="h-2 flex-1 rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          "linear-gradient(90deg,var(--brand-green),var(--brand-gold))",
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-6">
        <label className="text-sm">
          Sort by:{" "}
          <select
            className="rounded-xl border border-neutral-300 bg-white/80 px-2 py-1"
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value as Sort);
            }}
          >
            <option value="recent">Most recent</option>
            <option value="helpful">Most helpful</option>
            <option value="highest">Highest rating</option>
            <option value="lowest">Lowest rating</option>
          </select>
        </label>

        <div className="text-sm text-neutral-600">
          Page {page} / {pages}
        </div>
      </div>

      {/* List */}
      <div className="mt-4 space-y-4">
        {items.map((r) => (
          <article
            key={r.id}
            className="rounded-2xl border border-[rgba(0,0,0,.08)] bg-white/70 p-4 shadow-[0_8px_30px_rgba(0,0,0,.06)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">{r.authorName || "Anonymous"}</div>
                {r.verifiedPurchase && (
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg,#d4af37,#f2cf73)" }}
                  >
                    Verified purchase
                  </span>
                )}
              </div>
              <StarRating value={r.rating} />
            </div>

            {r.title && <h4 className="mt-2 font-semibold">{r.title}</h4>}
            <p className="mt-1 text-[15px] leading-6">{r.body}</p>

            <div className="mt-2 flex items-center gap-3 text-sm text-neutral-600">
              <time dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleDateString()}</time>

              <button
                onClick={() => markHelpful(r.id)}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-1 hover:bg-neutral-50"
                aria-label="Mark as helpful"
                title="Mark as helpful"
              >
                <ThumbsUp size={16} />
                Helpful ({r.helpfulCount})
              </button>

              <button
                onClick={() => flagReview(r.id)}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-1 hover:bg-neutral-50"
                aria-label="Flag this review"
                title="Flag this review"
              >
                🚩 Flag
              </button>
            </div>
          </article>
        ))}

        {!items.length && <p className="text-neutral-600">No reviews yet.</p>}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border px-3 py-1"
            disabled={page === 1}
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="rounded-xl border px-3 py-1"
            disabled={page === pages}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
