"use client";

import { useEffect, useMemo, useState } from "react";

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
  status?: "PENDING" | "APPROVED" | "REJECTED";
};

type AdminListResponse = { ok: true; items: Review[] } | { error: string; detail?: string };

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
type Status = typeof STATUSES[number];

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function AdminReviewsPage() {
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState<Status>("PENDING");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Review[]>([]);

  // load saved token from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("adminToken");
    if (saved) setToken(saved);
  }, []);

  const canFetch = useMemo(() => token.trim().length > 0, [token]);

  async function fetchReviews(s: Status = status) {
    if (!canFetch) return;
    setLoading(true);
    setError(null);
    try {
      const url = `/api/admin/reviews?status=${encodeURIComponent(s)}`;
      const res = await fetch(url, { headers: { "x-admin-token": token } });
      const data = (await res.json()) as AdminListResponse;
      if (!res.ok || "error" in data) {
        throw new Error((data as any).error || `HTTP ${res.status}`);
      }
      setItems(data.items);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function act(id: number, action: "APPROVE" | "REJECT") {
    if (!canFetch) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "POST",
        headers: {
          "x-admin-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || `HTTP ${res.status}`);
      // refresh list after action
      await fetchReviews(status);
    } catch (e: any) {
      setError(e?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  function saveToken(t: string) {
    setToken(t);
    localStorage.setItem("adminToken", t);
  }

  // first load
  useEffect(() => {
    if (canFetch) fetchReviews(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Admin · Reviews</h1>

      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 mb-6">
        <div className="grid gap-3 sm:grid-cols-3 items-end">
          <div className="sm:col-span-2">
            <label className="text-sm mb-1 block">Admin token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => saveToken(e.target.value)}
              placeholder="Enter ADMIN_TOKEN"
              className="w-full rounded-lg bg-black/50 border border-white/15 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-gold)]"
            />
            <p className="text-xs opacity-70 mt-1">
              Stored locally in your browser (localStorage). Same value as <code>ADMIN_TOKEN</code> in your <code>.env</code>.
            </p>
          </div>

          <div>
            <label className="text-sm mb-1 block">Status filter</label>
            <div className="flex gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="flex-1 rounded-lg bg-black/50 border border-white/15 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-gold)]"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                onClick={() => fetchReviews(status)}
                disabled={!canFetch || loading}
                className="rounded-lg px-4 py-2 border border-[var(--brand-gold)] text-sm btn-gold disabled:opacity-60"
              >
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-300">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* table */}
      <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs uppercase tracking-wide opacity-70 border-b border-white/10">
          <div className="col-span-2">Product</div>
          <div className="col-span-1">Rating</div>
          <div className="col-span-5">Content</div>
          <div className="col-span-2">Meta</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {!items.length ? (
          <div className="px-4 py-8 text-sm opacity-70">No reviews found for <strong>{status}</strong>.</div>
        ) : (
          items.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-3 px-4 py-4 border-b border-white/5">
              <div className="col-span-2">
                <div className="font-medium break-words">{r.productSlug}</div>
                <div className="text-xs opacity-70">{timeAgo(r.createdAt)}</div>
              </div>
              <div className="col-span-1">
                <div className="text-yellow-400" aria-label={`${r.rating} out of 5`}>
                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                </div>
                <div className="text-xs opacity-70 mt-1">{r.verifiedPurchase ? "Verified" : ""}</div>
              </div>
              <div className="col-span-5">
                {r.title ? <div className="text-sm font-semibold">{r.title}</div> : null}
                <div className="text-sm whitespace-pre-wrap break-words">{r.body}</div>
                <div className="text-xs opacity-70 mt-1">by {r.authorName}</div>
              </div>
              <div className="col-span-2 text-sm">
                <div>Helpfulness: {r.helpfulCount}</div>
                {r.status ? <div className="text-xs opacity-70 mt-1">Status: {r.status}</div> : null}
              </div>
              <div className="col-span-2 text-right">
                <div className="inline-flex gap-2">
                  <button
                    onClick={() => act(r.id, "APPROVE")}
                    disabled={!canFetch || loading}
                    className="rounded-lg px-3 py-1.5 text-sm border border-emerald-500/60 hover:bg-emerald-500/10 disabled:opacity-60"
                    title="Approve"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(r.id, "REJECT")}
                    disabled={!canFetch || loading}
                    className="rounded-lg px-3 py-1.5 text-sm border border-red-500/60 hover:bg-red-500/10 disabled:opacity-60"
                    title="Reject"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
