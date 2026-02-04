// components/VariantChooser.tsx
"use client";

import { useCart } from "./CartContext";

const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

type VariantLike = { label?: string; priceCents?: number; price?: number };

type ProductLike = {
  id: string;
  name: string;
  image?: string;
  variants?: VariantLike[];
  priceCents?: number; // fallback if no variants
};

function toCents(v: VariantLike | number | undefined): number {
  if (typeof v === "number") return Math.round(v);
  if (!v) return 0;
  if (typeof (v as VariantLike).priceCents === "number")
    return Math.round((v as VariantLike).priceCents!);
  if (typeof (v as VariantLike).price === "number") {
    const dollars = (v as VariantLike).price!;
    return Math.round(dollars >= 1000 ? dollars : dollars * 100);
  }
  return 0;
}

export default function VariantChooser({ product }: { product: ProductLike }) {
  const { addToCart } = useCart();

  // No variants → single Add
  if (!product.variants?.length) {
    const cents = toCents(product.priceCents);
    return (
      <button
        className="rounded-full bg-gradient-to-r from-lime-300 to-green-500 text-black font-medium px-4 py-2 shadow-md border border-[var(--brand-gold)]"
        onClick={() =>
          addToCart({
            id: product.id,
            name: product.name,
            image: product.image,
            priceCents: cents,
          })
        }
      >
        Add
      </button>
    );
  }

  // With variants → one Add per variant
  return (
    <div className="space-y-2">
      {product.variants.map((v, idx) => {
        const cents = toCents(v);
        const label = String(v.label ?? `Option ${idx + 1}`);
        return (
          <div key={label} className="flex items-center justify-between">
            <div className="text-sm">
              <span className="opacity-90">{label}</span>{" "}
              <span className="opacity-70">— {usd(cents)}</span>
            </div>
            <button
              className="rounded-full bg-gradient-to-r from-lime-300 to-green-500 text-black font-medium px-3 py-1.5 shadow-md border border-[var(--brand-gold)]"
              onClick={() =>
                addToCart({
                  id: product.id,
                  name: product.name,
                  image: product.image,
                  variant: label,
                  priceCents: cents,
                  quantity: 1,
                })
              }
            >
              Add
            </button>
          </div>
        );
      })}
    </div>
  );
}
