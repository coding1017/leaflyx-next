// app/search/page.tsx
import { listProducts, type Product } from "@/lib/db";
import { ProductGrid } from "@/components/ProductGrid";

/** ---------- helpers (same fuzzy scorer as before) ---------- */
const norm = (v: unknown) => (v == null ? "" : String(v).toLowerCase());
const tokenize = (s: string) =>
  norm(s)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const v0 = new Array(b.length + 1);
  const v1 = new Array(b.length + 1);
  for (let i = 0; i <= b.length; i++) v0[i] = i;
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}

function similarity(a: string, b: string): number {
  a = norm(a);
  b = norm(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.startsWith(b) || b.startsWith(a)) return 0.92;
  if (a.includes(b) || b.includes(a)) return 0.82;
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size || 1;
  const jaccard = inter / union;
  const dist = levenshtein(a, b);
  const ratio = 1 - dist / Math.max(a.length, b.length);
  return Math.max(0, Math.max(jaccard, ratio) * 0.9 + jaccard * 0.1);
}

function scoreProduct(p: Product, q: string): number {
  const fields = [
    p?.name,
    (p as any)?.description,
    (p as any)?.slug,
    (p as any)?.category,
    ...(((p as any)?.tags as string[] | undefined) ?? []),
  ].map(norm);

  const qTokens = tokenize(q);
  if (qTokens.length === 0) return 0;

  let total = 0;
  for (const t of qTokens) {
    let best = 0;
    for (const f of fields) {
      if (!f) continue;
      const s =
        similarity(f, t) +
        (f.startsWith(t) ? 0.08 : 0) +
        (f.includes(t) ? 0.04 : 0) +
        (norm(p?.name).includes(t) ? 0.06 : 0);
      if (s > best) best = s;
    }
    total += best;
  }
  const name = norm(p?.name);
  const nameBonus = name && name.includes(norm(q)) ? 0.06 : 0;
  return Math.min(1, total / qTokens.length + nameBonus);
}

/** ---------- page ---------- */
export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const raw = typeof searchParams?.q === "string" ? searchParams.q : "";
  const q = raw.trim();
  const all: Product[] = listProducts();

  const scored = q
    ? all
        .map((p) => ({ p, score: scoreProduct(p, q) }))
        .sort((a, b) => b.score - a.score)
    : [];

  const HARD_MATCH = 0.38;
  const SOFT_MATCH = 0.18;

  const results: Product[] = q
    ? scored.filter(({ score }) => score >= HARD_MATCH).map((s) => s.p)
    : [];

  const emptySuggestions: Product[] = !q
    ? [...all]
        .sort((a, b) => norm(a?.name).localeCompare(norm(b?.name)))
        .slice(0, 8)
    : [];

  const nearMatches: Product[] =
    q && results.length === 0
      ? scored.filter(({ score }) => score >= SOFT_MATCH).slice(0, 8).map((s) => s.p)
      : [];

  const didYouMean =
    q && results.length === 0 && scored.length > 0 ? scored[0].p?.name ?? "" : "";

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Heading = WHITE for contrast */}
      <h1 className="text-2xl font-semibold text-white mb-2">
        {q ? `Search results for “${q}”` : "Search"}
      </h1>

      {q ? (
        <p className="text-sm text-gray-300 mb-6">
          {results.length} item{results.length === 1 ? "" : "s"} found
        </p>
      ) : (
        <p className="text-sm text-gray-300 mb-6">
          Try keywords like “gelato”, “smalls”, “vape”, “edibles”, “pre-rolls”…
        </p>
      )}

      {/* Results — use your exact grid; hide sort controls here if you want */}
      {results.length > 0 && (
        <div className="mb-10">
          <ProductGrid items={results} showSort={false} />
        </div>
      )}

      {/* Suggestions when empty */}
      {!q && emptySuggestions.length > 0 && (
        <>
          <h2 className="text-lg font-medium text-white mb-3">Suggestions</h2>
          <ProductGrid items={emptySuggestions} showSort={false} />
        </>
      )}

      {/* No results → near matches */}
      {q && results.length === 0 && (
        <div className="space-y-6">
          <p className="text-gray-200">
            No exact matches{didYouMean ? ` — did you mean “${didYouMean}”?` : "" }
          </p>

          {nearMatches.length > 0 && (
            <>
              <h3 className="text-lg font-medium text-white">Close matches</h3>
              <ProductGrid items={nearMatches} showSort={false} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
