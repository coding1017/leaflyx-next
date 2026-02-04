"use client";

import { useState } from "react";
import { useCart } from "@/components/CartContext";
import { useRouter } from "next/navigation";

export default function ReorderButton({ orderId }: { orderId: string }) {
  const cart = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onReorder() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`, { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Reorder failed");
        return;
      }

      // Rebuild cart from the old order
      cart.clear();
      for (const it of data.items as any[]) {
        cart.addToCart({
          id: String(it.id),
          name: String(it.name),
          variant: it.variant ?? null,
          priceCents: Number(it.priceCents) || 0,
          quantity: Number(it.qty) || 1,
        });
      }

      // Optional: send them to checkout or open cart page
      router.push("/cart"); // change to your checkout route if you have one
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onReorder}
      disabled={loading}
      className="rounded-xl bg-white px-4 py-2 text-black font-medium hover:opacity-90 disabled:opacity-60"
    >
      {loading ? "Reordering…" : "One-click reorder"}
    </button>
  );
}
