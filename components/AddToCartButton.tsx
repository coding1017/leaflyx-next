// components/AddToCartButton.tsx
"use client";

import { useState } from "react";
import type { StaticImageData } from "next/image";
import { useCart } from "./CartContext";
import { getProductById } from "@/lib/db";

type Props = {
  id: string;               // productId (e.g. "fl-03")
  name?: string;
  image?: string | StaticImageData;  // ✅ accept StaticImageData or string
  /** If you pass a variant, this line will be distinct in the cart */
  variant?: string;
  /** Prefer cents; dollars fallback is accepted too */
  price?: number;           // dollars (e.g. 12.00)
  priceCents?: number;      // cents (e.g. 1200)
  quantity?: number;        // default 1
  disabled?: boolean;
  className?: string;
};

function toCents(priceCents?: number, price?: number, fallback?: number) {
  if (typeof priceCents === "number") return Math.round(priceCents);
  if (typeof price === "number") return Math.round(price >= 1000 ? price : price * 100);
  return typeof fallback === "number" ? Math.round(fallback) : 0;
}

// ✅ normalize any image-like value to a plain URL string
function toUrl(img: unknown): string {
  if (!img) return "/images/placeholder.png";
  if (typeof img === "string") return img;
  if (typeof img === "object" && "src" in (img as StaticImageData)) {
    return (img as StaticImageData).src;
  }
  return "/images/placeholder.png";
}

export function AddToCartButton({
  id,
  name,
  image,
  variant,
  price,
  priceCents,
  quantity = 1,
  disabled,
  className,
}: Props) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const prod = getProductById(id);

      const resolvedName = name ?? prod?.name ?? "Item";
      // ⚠️ ensure we store a STRING url in the cart (never StaticImageData)
      const resolvedImage = toUrl(image ?? (prod as any)?.image ?? "/images/placeholder.png");
      const resolvedPriceCents = toCents(priceCents, price, (prod as any)?.price);

      if (resolvedPriceCents == null) {
        console.error("AddToCart: missing price", { id, price, priceCents, prod });
        throw new Error("Price unavailable for this item.");
      }

      addToCart({
        id,
        name: resolvedName,
        image: resolvedImage,   // ✅ string only
        variant,
        priceCents: resolvedPriceCents,
        quantity,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={`btn ${className ?? ""}`}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      onClick={handleAdd}
    >
      {disabled ? "Sold Out" : loading ? "Adding…" : "Add"}
    </button>
  );
}
