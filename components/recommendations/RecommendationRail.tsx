import Link from "next/link";
import Image from "next/image";
import { products } from "@/lib/products";

const GOLD = "#d4af37";

type ProductCardInput = {
  id: string;
  slug: string;
  name: string;
};

function findFullProduct(slugOrId: string) {
  return (products as any[]).find(
    (p) => p?.slug === slugOrId || String(p?.id) === String(slugOrId)
  );
}

// ✅ robust money coercion (handles "$12.00", "12", 12, 1200 cents, etc.)
function coerceDollars(v: any): number | null {
  if (v == null) return null;

  // cents style
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const s = String(v).trim();
  if (!s) return null;

  // strip everything except digits and dot
  const cleaned = s.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function coerceFromCents(v: any): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v / 100;
}

function getDisplayPrice(full: any): { from: boolean; price: number | null } {
  if (!full) return { from: false, price: null };

  const variants = Array.isArray(full?.variants) ? full.variants : null;

  // ✅ If variants exist, show min variant price as "From"
  if (variants && variants.length) {
    const prices = variants
      .map((v: any) => {
        // prefer explicit dollars, else cents
        const dollars = coerceDollars(v?.price);
        if (dollars != null) return dollars;

        const cents = coerceFromCents(v?.priceCents);
        if (cents != null) return cents;

        return null;
      })
      .filter((n: number | null): n is number => typeof n === "number" && Number.isFinite(n) && n > 0);

    if (prices.length) return { from: true, price: Math.min(...prices) };
  }

  // ✅ fallback: base product price (dollars or cents)
  const baseDollars = coerceDollars(full?.price);
  if (baseDollars != null && baseDollars > 0) return { from: false, price: baseDollars };

  const baseCents = coerceFromCents(full?.priceCents);
  if (baseCents != null && baseCents > 0) return { from: false, price: baseCents };

  return { from: false, price: null };
}

export default function RecommendationRail({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: ProductCardInput[];
}) {
  if (!items?.length) return null;

  return (
    <section className="mt-10">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
      </div>

      <div
        className="rounded-2xl p-4"
        style={{
          border: `3px solid ${GOLD}`,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {items.map((it) => {
            const full = findFullProduct(it.slug) ?? findFullProduct(it.id);

            const img = full?.image ?? full?.images?.[0];
            const category = full?.category ?? "Premium";

            const dp = getDisplayPrice(full);

            return (
              <Link
                key={`${it.id}__${it.slug}`}
                href={`/shop/${it.slug}`}
                className="min-w-[220px] max-w-[220px] rounded-2xl overflow-hidden transition-transform hover:-translate-y-1"
                style={{
                  border: `3px solid ${GOLD}`,
                  background: "rgba(0,0,0,0.55)",
                  boxShadow: "0 0 22px rgba(212,175,55,0.35)",
                }}
              >
                <div
                  className="relative h-[140px] w-full overflow-hidden"
                  style={{
                    backgroundColor: "#000",
                    borderBottom: `3px solid ${GOLD}`,
                  }}
                >
                  {img ? (
                    <Image
                      src={typeof img === "string" ? img : img?.src ?? img}
                      alt={it.name}
                      fill
                      sizes="220px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-white/40">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <div className="text-sm font-semibold leading-snug">
                    <span className="bg-gradient-to-r from-emerald-200 to-yellow-200 bg-clip-text text-transparent">
                      {it.name}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span
                      className="rounded-full px-2 py-[2px]"
                      style={{
                        border: `1px solid ${GOLD}`,
                        background: "rgba(0,0,0,0.6)",
                        color: GOLD,
                      }}
                    >
                      {category}
                    </span>

                    {dp.price != null && (
                      <span className="text-white/80">
                        {dp.from ? "From " : ""}${dp.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
