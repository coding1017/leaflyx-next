// components/reviews/reviewSummaryClient.ts
"use client";

/**
 * Batches many ReviewBadge requests into a few /api/reviews/summary calls.
 * Also dedupes + caches results in-memory to prevent refetch spam (esp. in dev/StrictMode).
 */

export type ReviewSummary = { count: number; average: number };
export type ReviewSummaryMap = Record<string, ReviewSummary>;

const cache = new Map<string, ReviewSummary>(); // slug -> summary
const inflight = new Map<string, Promise<ReviewSummary | null>>(); // slug -> promise

let queued = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function normalizeSlug(slug: string) {
  return String(slug || "").trim();
}

async function fetchBatch(slugs: string[]): Promise<ReviewSummaryMap> {
  // supports your API: ?slugs=a,b,c
  const param = encodeURIComponent(slugs.join(","));
  const r = await fetch(`/api/reviews/summary?slugs=${param}`, {
    // IMPORTANT: allow browser to reuse results within session,
    // but our in-memory cache is the real win.
    cache: "no-store",
  });

  if (!r.ok) return {};
  const j = await r.json();

  // Your API returns { ok: true, data: { [slug]: {count, average} }, degraded?: true }
  const data = (j?.data ?? {}) as ReviewSummaryMap;
  return data && typeof data === "object" ? data : {};
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    const slugs = Array.from(queued).filter(Boolean);
    queued = new Set<string>();
    flushTimer = null;

    if (!slugs.length) return;

    try {
      const data = await fetchBatch(slugs);

      // fill cache with whatever came back; missing ones become 0/0
      for (const s of slugs) {
        const entry = data[s];
        if (entry && typeof entry.count === "number" && typeof entry.average === "number") {
          cache.set(s, entry);
        } else {
          cache.set(s, { count: 0, average: 0 });
        }
      }
    } catch {
      // On failure, mark them as 0/0 so UI doesn't thrash retrying
      for (const s of slugs) cache.set(s, { count: 0, average: 0 });
    } finally {
      // resolve inflight promises for these slugs
      for (const s of slugs) {
        const p = inflight.get(s);
        // we can't "resolve" here because the promise already resolved by reading cache in the getter below,
        // but removing inflight lets future calls use cache directly.
        inflight.delete(s);
        void p;
      }
    }
  }, 25); // small window to collect many cards into one request
}

/**
 * Get summary for one slug.
 * - returns cached result immediately if present
 * - otherwise batches into a shared request and returns when cache is populated
 */
export function getReviewSummary(slug: string): Promise<ReviewSummary | null> {
  const s = normalizeSlug(slug);
  if (!s) return Promise.resolve(null);

  const cached = cache.get(s);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(s);
  if (existing) return existing;

  // Create a promise that waits until after the next flush populates cache
  const p = (async () => {
    queued.add(s);
    scheduleFlush();

    // Wait until flush runs (max ~1 tick + request time)
    // Poll cache briefly; keep it lightweight
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 20));
      const now = cache.get(s);
      if (now) return now;
    }
    return null;
  })();

  inflight.set(s, p);
  return p;
}
