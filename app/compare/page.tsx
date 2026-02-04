// app/compare/page.tsx
import Link from "next/link";
import CompareClient from "./CompareClient";
import { products } from "@/lib/products";

function parseItems(searchParams: Record<string, string | string[] | undefined>) {
  const raw = searchParams.items;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return [];
  return s
    .split(",")
    .map((x) => decodeURIComponent(x).trim())
    .filter(Boolean)
    .slice(0, 3);
}

export default function ComparePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const slugs = parseItems(searchParams);

  const selected = slugs
    .map((slug) =>
      products.find((p) => String(p.slug).toLowerCase() === slug.toLowerCase())
    )
    .filter(Boolean) as any[];

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 text-white">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--brand-gold)]">
            Compare products
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Side-by-side clarity: THCA %, type, and price per gram.
          </p>
        </div>

        <Link
          href="/products"
          className="btn-gold rounded-xl px-4 py-2 text-sm font-semibold border border-[var(--brand-gold)]"
        >
          Back to shop
        </Link>
      </div>

      {selected.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-[var(--brand-gold)]/35 bg-black/25 backdrop-blur p-6">
          <p className="text-white/80">
            No items selected. Go back and add up to 3 products to compare.
          </p>
        </div>
      ) : (
        // ✅ No wrapper frame here — CompareClient owns the smokey-glass + gold frame
        <CompareClient initial={selected} />
      )}
    </main>
  );
}
