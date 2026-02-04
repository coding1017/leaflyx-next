// components/MiniCart.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, X, Plus } from "lucide-react";
import { useCart } from "./CartContext";
import { getRecommendations } from "@/lib/recommendations";
import { products } from "@/lib/products";

const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

type MiniCartRender = (args: { open: boolean; toggle: () => void }) => React.ReactNode;

const GOLD = "#d4af37";

function srcOf(img: any): any {
  return img;
}

function pickDefaultVariant(p: any) {
  const vars = Array.isArray(p?.variants) ? p.variants : [];
  if (!vars.length) return null;
  const popular = vars.find((v: any) => v?.isPopular);
  return popular ?? vars[0] ?? null;
}

export default function MiniCart({ children }: { children?: React.ReactNode | MiniCartRender }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const cart = useCart() as any;
  const { items, inc, dec, remove, subtotalCents, count } = cart;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setAnimateIn(false);
    const id = requestAnimationFrame(() => setAnimateIn(true));

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      cancelAnimationFrame(id);
      setAnimateIn(false);
    };
  }, [open]);

  // ---- Trigger ----
  let trigger: React.ReactNode;
  if (typeof children === "function") {
    trigger = (children as MiniCartRender)({ open, toggle: () => setOpen((v) => !v) });
  } else if (React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    trigger = React.cloneElement(child, {
      onClick: (e: any) => {
        child.props?.onClick?.(e);
        setOpen(true);
      },
      "aria-haspopup": "dialog",
      "aria-expanded": open,
      "data-open": open ? "true" : "false",
    });
  } else {
    trigger = (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open cart"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative rounded-2xl p-2 bg-black/40 hover:bg-black/60 transition"
      >
        <ShoppingCart className="w-5 h-5" />
        <CartBadge />
      </button>
    );
  }

  // ---- Recommendations (Pairs well) ----
  const lastCartItem = useMemo(() => {
    if (!Array.isArray(items) || !items.length) return null;
    return items[items.length - 1] ?? null;
  }, [items]);

  const cartIds = useMemo(() => {
    const s = new Set<string>();
    (items ?? []).forEach((it: any) => {
      if (it?.id) s.add(String(it.id));
    });
    return s;
  }, [items]);

  const pairsWell = useMemo(() => {
    if (!lastCartItem?.id) return [];
    const rec = getRecommendations(String(lastCartItem.id), 10).pairsWell;

    const enriched = rec
      .map((lite) => (products as any[]).find((p) => p.id === lite.id || p.slug === lite.slug))
      .filter(Boolean)
      .filter((p) => !cartIds.has(String((p as any).id)))
      .slice(0, 8);

    return enriched;
  }, [lastCartItem, cartIds]);

  const canAddFromRec = typeof cart?.addToCart === "function";

  function addRecommendedToCart(p: any) {
    if (!canAddFromRec) return;

    const chosenVariant = pickDefaultVariant(p);
    const priceDollars = chosenVariant?.price ?? p?.price ?? 0;
    const priceCents = Math.round(Number(priceDollars) * 100);

    const variantLabel: string | undefined =
      chosenVariant?.label ? String(chosenVariant.label) : undefined;

    cart.addToCart({
      id: String(p.id),
      name: variantLabel ? `${p.name} — ${variantLabel}` : String(p.name),
      image: typeof p.image === "string" ? p.image : p.image?.src ?? undefined,
      priceCents,
      variant: variantLabel ?? null,
      quantity: 1,
    });
  }

  if (!mounted) return trigger;

  // widths / dividers
  const REC_W = 320; // 460 -> 320 (≈30% smaller)
  const CART_W = 420; // keep your cart width
  const DIVIDER_W = 3; // 3x thicker

  return (
    <>
      {trigger}

      {open &&
        createPortal(
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9999]">
            {/* overlay */}
            <div
              className={`absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-200 ${
                animateIn ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setOpen(false)}
            />

            {/* wrapper */}
            <div
              className={`
                absolute right-0 top-0 h-full
                flex
                transform transition-transform duration-300 will-change-transform
                ${animateIn ? "translate-x-0" : "translate-x-full"}
              `}
              style={{ gap: 0 }}
            >
              {/* LEFT: Pairs well (hidden on small screens) */}
              <aside
                className={`
                  hidden lg:flex h-full
                  border-l
                  bg-black/70 text-white
                  flex-col
                `}
                style={{
                  width: REC_W,
                  borderColor: GOLD,
                  boxShadow: "0 0 48px rgba(212,175,55,0.12)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      {/* ✅ matches Cart sizing + subtle underline */}
                      <h3 className="text-xl font-semibold leading-none">
                        <span className="bg-gradient-to-r from-emerald-200 to-yellow-200 bg-clip-text text-transparent">
                          Pairs Well With
                        </span>
                      </h3>

                      <div
                        className="mt-2 h-[2px] w-32 rounded-full"
                        style={{
                          background:
                            "linear-gradient(90deg, rgba(212,175,55,0.0), rgba(212,175,55,0.75), rgba(212,175,55,0.0))",
                          opacity: 0.9,
                        }}
                      />
                    </div>

                    {lastCartItem?.name ? (
                      <div className="text-xs text-white/55 truncate max-w-[140px]">
                        Based on: <span className="text-white/75">{lastCartItem.name}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="px-4 pb-4 overflow-y-auto flex-1">
                  {!pairsWell.length ? (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
                      Add an item to your cart to see suggestions.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {pairsWell.map((p: any) => {
                        const chosenVariant = pickDefaultVariant(p);
                        const priceDollars = chosenVariant?.price ?? p?.price ?? 0;

                        return (
                          <div
                            key={String(p.id)}
                            className="rounded-2xl overflow-hidden"
                            style={{
                              border: `2px solid ${GOLD}`,
                              background: "rgba(0,0,0,0.55)",
                              boxShadow: "0 0 22px rgba(212,175,55,0.10)",
                            }}
                          >
                            <div className="flex gap-3 p-3">
                              <div
                                className="relative w-[76px] h-[76px] rounded-xl overflow-hidden shrink-0"
                                style={{
                                  border: `2px solid ${GOLD}`,
                                  backgroundColor: "#000",
                                }}
                              >
                                <Image
                                  src={srcOf(p.image)}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                  sizes="76px"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold leading-snug">
                                  <span className="bg-gradient-to-r from-emerald-200 to-yellow-200 bg-clip-text text-transparent">
                                    {p.name}
                                  </span>
                                </div>

                                <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
                                  <span
                                    className="rounded-full px-2 py-[2px]"
                                    style={{
                                      border: `1px solid ${GOLD}`,
                                      background: "rgba(0,0,0,0.5)",
                                      color: GOLD,
                                    }}
                                  >
                                    {p.category ?? "Premium"}
                                  </span>

                                  {chosenVariant?.label ? (
                                    <span className="text-white/60">• {chosenVariant.label}</span>
                                  ) : null}
                                </div>

                                <div className="mt-2 flex items-center justify-between gap-3">
                                  <div className="text-sm text-white/85">
                                    ${Number(priceDollars).toFixed(2)}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Link
                                      href={`/products/${p.slug}`}
                                      className="text-xs text-white/70 hover:text-white underline underline-offset-4"
                                    >
                                      View
                                    </Link>

                                    <button
                                      type="button"
                                      onClick={() => addRecommendedToCart(p)}
                                      disabled={!canAddFromRec}
                                      className={`
                                        inline-flex items-center gap-2
                                        rounded-full px-3 py-1.5 text-xs font-semibold
                                        transition
                                        ${canAddFromRec ? "" : "opacity-60 cursor-not-allowed"}
                                      `}
                                      style={{
                                        background: GOLD,
                                        color: "#000",
                                        border: `1px solid rgba(0,0,0,0.65)`,
                                        boxShadow: "0 10px 26px rgba(212,175,55,0.22)",
                                      }}
                                      aria-label={`Add ${p.name} to cart`}
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div
                              className="h-[2px] w-full"
                              style={{
                                background:
                                  "linear-gradient(90deg, transparent, rgba(212,175,55,0.55), transparent)",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>

              {/* ✅ Thick divider between columns */}
              <div
                aria-hidden="true"
                className="hidden lg:block h-full"
                style={{
                  width: DIVIDER_W,
                  background:
                    "linear-gradient(180deg, rgba(212,175,55,0.0), rgba(212,175,55,0.85), rgba(212,175,55,0.0))",
                  boxShadow: "0 0 22px rgba(212,175,55,0.28)",
                }}
              />

              {/* RIGHT: Cart panel */}
              <div
                className={`
                  h-full
                  w-[380px] sm:w-[420px]
                  bg-black/85 text-white shadow-xl
                  flex flex-col
                `}
                style={{
                  width: CART_W,
                  borderLeft: "none", // divider now handles it
                }}
              >
                {/* header */}
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  {/* ✅ make sure this matches Pairs Well With size */}
                  <h2 className="text-xl font-semibold leading-none">
                    <span className="text-[var(--brand-gold)]">Cart</span>
                  </h2>

                  <button
                    aria-label="Close cart"
                    className="rounded-full p-1 hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* subtle underline under Cart too (matches left) */}
                <div
                  className="mx-4 h-[2px] w-20 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(212,175,55,0.0), rgba(212,175,55,0.7), rgba(212,175,55,0.0))",
                    opacity: 0.85,
                  }}
                />

                {/* content */}
                <div className="px-4 pb-4 overflow-y-auto flex-1">
                  {!items.length ? (
                    <div className="mt-8 text-center text-gray-300">Your cart is empty.</div>
                  ) : (
                    <div className="mt-3 space-y-4">
                      <ul className="space-y-3">
                        {items.map((it: any) => (
                          <li key={`${it.id}__${it.variant ?? "base"}`} className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-lg overflow-hidden glow-card aura-strong shrink-0">
                              {it.image ? (
                                <Image
                                  src={it.image}
                                  alt={it.name}
                                  width={56}
                                  height={56}
                                  className="w-14 h-14 object-contain bg-black/40"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-black/40" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
  <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
    {it.name}
  </span>
</div>

                              {it.variant && <div className="text-xs text-gray-400">Variant: {it.variant}</div>}
                              <div className="text-xs text-gray-400">{usd(it.priceCents)}</div>

                              <div className="mt-1 flex items-center gap-2">
                                <button
                                  className="w-7 h-7 rounded-full"
                                  style={{ border: `1px solid ${GOLD}` }}
                                  onClick={() => dec(it.id, it.variant)}
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>
                                <div className="w-8 text-center text-sm">{it.qty}</div>
                                <button
                                  className="w-7 h-7 rounded-full"
                                  style={{ border: `1px solid ${GOLD}` }}
                                  onClick={() => inc(it.id, it.variant)}
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>

                                <button
                                  className="ml-2 text-xs text-red-300 hover:text-red-200"
                                  onClick={() => remove(it.id, it.variant)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            <div className="text-sm font-semibold">{usd(it.priceCents * it.qty)}</div>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <div className="text-gray-300">Subtotal</div>
                        <div className="text-lg font-semibold">{usd(subtotalCents)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* footer */}
<div className="px-4 py-6 relative">
  {/* neon glow halo */}
  <div
    aria-hidden
    className="absolute inset-x-4 bottom-6 h-14 rounded-full"
    style={{
      background:
        "radial-gradient(circle at center, rgba(212,175,55,0.55), rgba(212,175,55,0.15), transparent 70%)",
      filter: "blur(22px)",
      zIndex: 0,
    }}
  />

  <Link
    href="/cart"
    onClick={() => setOpen(false)}
    className="
      relative z-10
      block w-full text-center rounded-full
      font-semibold text-base
      px-5 py-3
      border border-black/70
      transition
      hover:-translate-y-[1px]
      active:translate-y-0
    "
    style={{
      background: GOLD,
      color: "#000",
      boxShadow: `
        0 0 0 1px rgba(0,0,0,0.6),
        0 10px 28px rgba(212,175,55,0.45),
        0 0 60px rgba(212,175,55,0.55),
        0 0 120px rgba(212,175,55,0.35)
      `,
    }}
  >
    Go to cart
  </Link>
</div>


                {typeof count === "number" && <span className="sr-only">Items in cart: {count}</span>}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function CartBadge() {
  const { count } = useCart();
  if (!count) return null;
  return (
    <span
      className="
        absolute -top-1 -right-1 min-w-[18px] h-5 px-1
        rounded-full bg-gradient-to-r from-lime-300 to-green-500
        text-black text-xs font-semibold grid place-items-center
        border border-[var(--brand-gold)]
      "
    >
      {count}
    </span>
  );
}
