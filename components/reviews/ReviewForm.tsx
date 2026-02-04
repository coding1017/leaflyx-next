"use client";
import { useEffect, useRef, useState } from "react";
import StarInput from "./StarInput";

export default function ReviewForm({ productSlug, onSubmitted }: {
  productSlug: string; onSubmitted?: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [verifiedPurchase, setVerifiedPurchase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const startedAt = useRef<number>(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/reviews?slug=${encodeURIComponent(productSlug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating, title, body, authorName, verifiedPurchase,
          startedAt: startedAt.current,
          website: honeypot.current?.value || "" // honeypot
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to submit");
      // reset
      setTitle(""); setBody(""); setAuthorName(""); setVerifiedPurchase(false); setRating(5);
      onSubmitted?.();
      // notify list to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("leaflyx:review:submitted", { detail: { slug: productSlug } }));
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ startedAt.current = Date.now(); }, []);

  return (
    <div className="rounded-2xl border border-[rgba(212,175,55,.35)] p-4 shadow-[0_0_0_3px_rgba(212,175,55,.15)]">
      <h3 className="text-lg font-semibold mb-2">Write a review</h3>
      <div className="mb-3"><StarInput value={rating} onChange={setRating} /></div>
      <div className="grid gap-3">
        <input
          className="rounded-xl border border-neutral-300 bg-white/80 px-3 py-2"
          placeholder="Title (optional)"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
        />
        <textarea
          className="rounded-xl border border-neutral-300 bg-white/80 px-3 py-2 min-h-28"
          placeholder="Share your experience…"
          value={body}
          onChange={(e)=>setBody(e.target.value)}
        />
        <div className="flex gap-3 items-center">
          <input
            className="rounded-xl border border-neutral-300 bg-white/80 px-3 py-2"
            placeholder="Your name"
            value={authorName}
            onChange={(e)=>setAuthorName(e.target.value)}
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={verifiedPurchase}
              onChange={(e)=>setVerifiedPurchase(e.target.checked)}
            />
            Verified purchase
          </label>
        </div>
        {/* Honeypot */}
        <input ref={honeypot} className="hidden" tabIndex={-1} autoComplete="off" name="website" />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-2xl px-4 py-2 font-medium text-black"
          style={{
            background: "linear-gradient(90deg, #d4af37, #f2cf73)",
            boxShadow: "0 8px 30px rgba(212,175,55,.35)",
          }}
        >
          {loading ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </div>
  );
}
