// components/account/ReorderButton.tsx
"use client";

import { useState } from "react";
import { useCart } from "@/components/CartContext";

type ReorderItem = {
  productId: string;
  name: string;
  variant: string | null;
  qty: number;
  priceCents: number;
  image?: string | null;
};

export default function ReorderButton({ orderId }: { orderId: string }) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  async function onReorder() {
    try {
      setLoading(true);

      const res = await fetch("/api/account/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const j = (await res.json()) as { items?: ReorderItem[]; error?: string };
      if (!res.ok) throw new Error(j?.error || "Failed to reorder");

      const items = j.items || [];
      for (const it of items) {
        addToCart({
          id: it.productId,
          name: it.variant ? `${it.name} — ${it.variant}` : it.name,
          image: it.image ?? undefined,
          priceCents: it.priceCents,
          variant: it.variant ?? null,
          quantity: it.qty,
        });
      }

      // optional: tell user it worked
      // (you can replace with a toast later)
      alert("Added last order items to cart.");
    } catch (e: any) {
      alert(e?.message || "Could not reorder. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onReorder}
      disabled={loading}
      className="
        rounded-xl bg-[#F5D77A]/90 px-4 py-2 font-medium text-black
        transition hover:bg-[#F5D77A] hover:shadow-[0_0_24px_rgba(245,215,122,0.28)]
        disabled:opacity-60 disabled:cursor-not-allowed
      "
    >
      {loading ? "Adding…" : "Reorder"}
    </button>
  );
}
