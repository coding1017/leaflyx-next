// components/CartContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useToast } from "@/components/ToastContext";
import { leaflyxAddToCartConfetti } from "@/lib/confetti";

export type CartItem = {
  id: string;
  name: string;
  image?: string;
  /** key difference: keep variant so lines are separate */
  variant?: string | null;
  priceCents: number;
  qty: number;
};

type AddPayload = {
  id: string;
  name: string;
  image?: string;
  variant?: string | null;
  priceCents: number; // cents
  quantity?: number; // default 1
};

type CartState = {
  items: CartItem[];
  addToCart: (p: AddPayload) => void;
  inc: (id: string, variant?: string | null) => void;
  dec: (id: string, variant?: string | null) => void;

  /** ✅ added: set qty directly (used by cart input) */
  setQty: (id: string, qty: number, variant?: string | null) => void;

  remove: (id: string, variant?: string | null) => void;
  clear: () => void;
  count: number;
  subtotalCents: number;
};

const STORAGE_KEY = "leaflyx_cart_v2";

const Ctx = createContext<CartState | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { pushToast } = useToast();

  // hydrate from localStorage (also normalize old shapes)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as any[];
      const normalized =
        Array.isArray(parsed)
          ? parsed
              .filter(Boolean)
              .map((i) => ({
                id: String(i.id),
                name: String(i.name ?? "Item"),
                image: i.image ?? undefined,
                variant: i.variant ?? null,
                priceCents:
                  typeof i.priceCents === "number"
                    ? Math.round(i.priceCents)
                    : typeof i.price === "number"
                    ? Math.round(i.price * 100)
                    : 0,
                qty:
                  typeof i.qty === "number"
                    ? i.qty
                    : typeof i.quantity === "number"
                    ? i.quantity
                    : 1,
              }))
              .filter((i) => i.id && i.priceCents >= 0 && i.qty > 0)
          : [];
      setItems(normalized);
    } catch {
      // ignore
    }
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback(
    (p: AddPayload) => {
      const keyVar = p.variant ?? null;
      const qtyToAdd = Math.max(1, Math.round(p.quantity ?? 1));

      setItems((prev) => {
        const idx = prev.findIndex(
          (i) => i.id === p.id && (i.variant ?? null) === keyVar
        );

        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            qty: next[idx].qty + qtyToAdd,
            // keep price current for that variant
            priceCents: Math.max(0, Math.round(p.priceCents)),
            // keep image if provided (helps reorder fill in later)
            image: p.image ?? next[idx].image,
            name: p.name ?? next[idx].name,
          };
          return next;
        }

        return [
          ...prev,
          {
            id: p.id,
            name: p.name,
            image: p.image,
            variant: keyVar,
            priceCents: Math.max(0, Math.round(p.priceCents)),
            qty: qtyToAdd,
          },
        ];
      });

      // ✅ Variant-aware add-to-cart confirmation toast
      pushToast({
        title: "Added to cart",
        description: `${p.name}${keyVar ? ` • ${keyVar}` : ""}`,
      });

      // ✅ Leaflyx pop confetti (top-right burst)
      leaflyxAddToCartConfetti();
    },
    [pushToast]
  );

  const inc = useCallback((id: string, variant?: string | null) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id && (i.variant ?? null) === (variant ?? null)
          ? { ...i, qty: i.qty + 1 }
          : i
      )
    );
  }, []);

  const dec = useCallback((id: string, variant?: string | null) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.id === id && (i.variant ?? null) === (variant ?? null)) {
          const q = i.qty - 1;
          return q <= 0 ? [] : [{ ...i, qty: q }];
        }
        return [i];
      })
    );
  }, []);

  // ✅ NEW: setQty for numeric input (min 1; remove if qty <= 0)
  const setQty = useCallback((id: string, qty: number, variant?: string | null) => {
    const nextQty = Number.isFinite(qty) ? Math.round(qty) : 1;

    setItems((prev) =>
      prev.flatMap((i) => {
        const sameLine = i.id === id && (i.variant ?? null) === (variant ?? null);
        if (!sameLine) return [i];

        if (nextQty <= 0) return []; // treat 0 as remove
        return [{ ...i, qty: Math.max(1, nextQty) }];
      })
    );
  }, []);

  const remove = useCallback((id: string, variant?: string | null) => {
    setItems((prev) =>
      prev.filter(
        (i) => !(i.id === id && (i.variant ?? null) === (variant ?? null))
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotalCents = useMemo(
    () => items.reduce((s, i) => s + i.priceCents * i.qty, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  const value: CartState = {
    items,
    addToCart,
    inc,
    dec,
    setQty, // ✅ added
    remove,
    clear,
    subtotalCents,
    count,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
