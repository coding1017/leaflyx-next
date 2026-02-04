// components/ProductDetailClient.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { AddToCartButton } from "@/components/AddToCartButton";
import ProductImageGallery from "@/components/ProductImageGallery";
import ProductLDJson from "@/components/reviews/ProductLDJson";
import Reviews from "@/components/reviews/Reviews";
import ReviewForm from "@/components/reviews/ReviewForm";
import BackInStockForm from "@/components/BackInStockForm";
import type { Product as LegacyProduct } from "@/lib/products";
import { products } from "@/lib/products";
import { getRecommendations } from "@/lib/recommendations";
import CoaVerifiedPill from "@/components/CoaVerifiedPill";
import ShippingExpectations from "@/components/ShippingExpectations";
import CompareToggle from "@/components/compare/CompareToggle";

// ✅ summary strip
import ReviewsSummaryStrip from "@/components/reviews/ReviewsSummaryStrip";

type PI = string | StaticImageData;
const srcOf = (img: PI): string => (typeof img === "string" ? img : img.src);

// Canonicalize variants to match DB keys like "1g", "3.5g", etc.
function canonVariant(input: unknown): string | null {
  if (input === null || input === undefined) return null;
  let s = String(input).trim();
  if (!s) return null;

  const m = s.match(/\(([^)]+)\)/);
  if (m?.[1]) s = m[1].trim();

  s = s.replace(/\s+/g, "").toLowerCase();
  return s || null;
}

// ✅ compute “display price” for recommendation cards
// - If variants exist: show the LOWEST variant price (“from” pricing behavior)
// - Else: show product.price
function getDisplayPrice(p: any): number {
  const base = Number(p?.price ?? 0);

  const vars = Array.isArray(p?.variants) ? p.variants : [];
  if (!vars.length) return base;

  const nums = vars
    .map((v: any) => Number(v?.price))
    .filter((n: number) => Number.isFinite(n) && n > 0);

  if (!nums.length) return base;

  return Math.min(...nums);
}

export type VariantUI = {
  id: string;
  label: string;
  price: number;
  isPopular?: boolean;
  qty: number;
  soldOut: boolean;
  subscribers?: number;
};

type Props = {
  slug: string;
  product: LegacyProduct;
  hasVariants: boolean;
  variantsUI: VariantUI[];
  nonVariantQty: number;
  initialSelectedVariantId?: string;

  /** ✅ NEW: lets the server page inject “What is THCA?” exactly where you want it */
  educationSlot?: React.ReactNode;
};

function ProductCardMini({ p }: { p: any }) {
  const href = `/products/${p.slug}`;
  const img = p.image;

  return (
    <Link
      href={href}
      className="
        group block
        rounded-2xl overflow-hidden
        bg-black/55
        border-2 border-[var(--brand-gold)]
        shadow-[0_0_22px_rgba(212,175,55,0.12)]
        hover:shadow-[0_0_30px_rgba(212,175,55,0.20)]
        transition
        w-[220px] sm:w-[240px]
        shrink-0
      "
    >
      <div
        className="relative w-full h-[140px] bg-black"
        style={{ borderBottom: "3px solid var(--brand-gold)" }}
      >
        <Image
          src={typeof img === "string" ? img : img?.src ?? img}
          alt={p.name}
          fill
          className="object-cover"
          sizes="240px"
        />
      </div>

      <div className="p-3">
        <div className="text-sm font-semibold leading-snug line-clamp-2">
          <span className="bg-gradient-to-r from-emerald-200 to-yellow-200 bg-clip-text text-transparent">
            {p.name}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-[2px] text-[11px]"
            style={{
              border: "1px solid var(--brand-gold)",
              color: "var(--brand-gold)",
              background: "rgba(0,0,0,0.55)",
            }}
          >
            {p.category ?? "Premium"}
          </span>

          <div className="text-sm text-white/85">
            ${Number(p.price ?? 0).toFixed(2)}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ProductDetailClient({
  slug,
  product,
  hasVariants,
  variantsUI,
  nonVariantQty,
  initialSelectedVariantId,
  educationSlot,
}: Props) {
  const productInactive = product.active === false;

  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialSelectedVariantId
  );

  // ✅ real review stats (fed from <Reviews />)
  const [reviewStats, setReviewStats] = useState<{
    avgRating: number;
    reviewCount: number;
  } | null>(null);

  const scrollToReviews = useCallback(() => {
    const el = document.getElementById("reviews");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ✅ FIX: stable callback (prevents max update depth loop)
  const handleReviewStats = useCallback((s: { avgRating: number; reviewCount: number }) => {
    const avg = Number.isFinite(s.avgRating) ? Math.max(0, Math.min(5, s.avgRating)) : 0;
    const count = Number.isFinite(s.reviewCount) ? Math.max(0, s.reviewCount) : 0;

    setReviewStats((prev) => {
      if (prev && prev.avgRating === avg && prev.reviewCount === count) return prev;
      return { avgRating: avg, reviewCount: count };
    });
  }, []);

  // One-time shimmer when you click/switch
  const [shimmerId, setShimmerId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!hasVariants) return undefined;
    if (!variantsUI?.length) return undefined;
    return variantsUI.find((v) => v.id === selectedId) ?? variantsUI[0];
  }, [hasVariants, variantsUI, selectedId]);

  const displayPrice = useMemo(() => {
    if (hasVariants) return Number(selected?.price ?? product.price);
    return Number(product.price);
  }, [hasVariants, selected, product.price]);

  const rawGallery: PI[] = useMemo(() => {
    const anyProduct = product as any;

    const imgs = anyProduct.images;
    if (Array.isArray(imgs) && imgs.length) return imgs as PI[];

    const primary = anyProduct.image;
    if (primary) return [primary as PI];

    return [];
  }, [product]);

  const galleryForRender: PI[] = (rawGallery.filter(Boolean) as PI[]).length
    ? (rawGallery.filter(Boolean) as PI[])
    : ["/images/placeholder.png"];

  const primaryImg: PI = galleryForRender[0];

  const allVariantsSoldOut =
    hasVariants && variantsUI.length > 0 && variantsUI.every((v) => v.soldOut);

  const variantSoldOut = hasVariants ? (selected?.soldOut ?? true) : nonVariantQty <= 0;

  const canAddToCart = !productInactive && !variantSoldOut;

  const selectedVariantKeyForRequest: string | null = hasVariants ? canonVariant(selected?.id) : null;

  // stop one-time shimmer
  useEffect(() => {
    if (!shimmerId) return;
    const t = setTimeout(() => setShimmerId(null), 520);
    return () => clearTimeout(t);
  }, [shimmerId]);

  // ✅ Customers also viewed (ONLY) — with correct pricing
  const alsoViewed = useMemo(() => {
    const baseKey = (product as any)?.id ?? slug;
    const lite = getRecommendations(String(baseKey), 10).alsoViewed;

    const enriched = lite
      .map((x) =>
        (products as any[]).find((p) => p.id === x.id || p.slug === x.slug)
      )
      .filter(Boolean)
      .slice(0, 8)
      // IMPORTANT: normalize displayed price to match your “real” pricing
      .map((p: any) => ({
        ...p,
        price: getDisplayPrice(p),
      }));

    return enriched;
  }, [product, slug]);

  return (
    <>
      <style jsx global>{`
        @keyframes leaflyxShimmerSweep {
          0% {
            transform: translateX(-140%) skewX(-18deg);
            opacity: 0;
          }
          12% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.9;
          }
          88% {
            opacity: 0.55;
          }
          100% {
            transform: translateX(140%) skewX(-18deg);
            opacity: 0;
          }
        }

        .leaflyx-shimmer {
          position: absolute;
          inset: -1px;
          border-radius: 0.95rem;
          pointer-events: none;
          overflow: hidden;
        }

        .leaflyx-shimmer::before {
          content: "";
          position: absolute;
          top: -45%;
          bottom: -45%;
          width: 46%;
          left: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(212, 175, 55, 0) 12%,
            rgba(212, 175, 55, 0.22) 35%,
            rgba(212, 175, 55, 0.85) 50%,
            rgba(212, 175, 55, 0.22) 65%,
            rgba(212, 175, 55, 0) 88%,
            transparent 100%
          );
          filter: blur(0.35px);
        }

        .leaflyx-shimmer-once::before {
          animation: leaflyxShimmerSweep 520ms ease-out forwards;
        }

        .leaflyx-shimmer-loop::before {
          animation: leaflyxShimmerSweep 2400ms ease-in-out infinite;
          opacity: 0.8;
        }

        .leaflyx-addwrap {
          display: inline-flex;
        }
        .leaflyx-addwrap button {
          position: relative;
          box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.22), 0 0 18px rgba(250, 204, 21, 0.18),
            0 0 34px rgba(250, 204, 21, 0.1);
          transition: box-shadow 220ms ease, transform 220ms ease, filter 220ms ease;
          animation: leaflyxAddPulse 1.9s ease-in-out infinite;
        }
        .leaflyx-addwrap button:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.28), 0 0 22px rgba(250, 204, 21, 0.22),
            0 0 42px rgba(250, 204, 21, 0.12);
          filter: brightness(1.02);
        }
        .leaflyx-addwrap button:active {
          transform: translateY(0px);
        }
        @keyframes leaflyxAddPulse {
          0%,
          100% {
            box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.22), 0 0 18px rgba(250, 204, 21, 0.16),
              0 0 34px rgba(250, 204, 21, 0.1);
          }
          50% {
            box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.28), 0 0 22px rgba(250, 204, 21, 0.2),
              0 0 40px rgba(250, 204, 21, 0.12);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .leaflyx-addwrap button {
            animation: none !important;
          }
          .leaflyx-shimmer-once::before {
            animation: none !important;
          }
          .leaflyx-shimmer-loop::before {
            animation: none !important;
          }
        }
      `}</style>

      {/* 2-col grid: IMAGE + INFO */}
      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8">
        {/* IMAGE */}
        <div className="glow-card aura-strong rounded-3xl overflow-hidden relative">
          <div className="p-4">
            <div className="halo-window thin">
              <div
                className="halo-wrap halo-clip rounded-2xl"
                style={{ ["--halo-cut" as any]: "36px" }}
              >
                <div className="img-card rounded-2xl">
                  <ProductImageGallery images={galleryForRender} alt={product.name} />
                </div>
              </div>
            </div>
            <div className="halo-gap" />
          </div>
        </div>

        {/* INFO */}
        <div className="glow-card aura-strong rounded-3xl border border-white/10 bg-black/30 p-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--brand-gold)]">
            {product.name}
          </h1>

          {reviewStats && reviewStats.reviewCount > 0 ? (
            <ReviewsSummaryStrip
              rating={reviewStats.avgRating}
              reviewCount={reviewStats.reviewCount}
              onClick={scrollToReviews}
            />
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {product.badge ? <span className="badge">{product.badge}</span> : null}
            {product.potency ? <span className="pill">{product.potency}</span> : null}
            {productInactive ? (
              <span className="pill border-red-500/30 text-red-200 bg-red-500/10">Inactive</span>
            ) : null}

            {!productInactive && (hasVariants ? allVariantsSoldOut : nonVariantQty <= 0) ? (
              <span className="pill border-white/15 text-white/80 bg-white/5">Sold out</span>
            ) : null}
          </div>

          {!productInactive && hasVariants && variantSoldOut && !allVariantsSoldOut ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--brand-gold)]/10 px-3 py-1 text-sm text-[var(--brand-gold)] border border-[var(--brand-gold)]/30">
              Selected size is sold out
            </div>
          ) : null}

          {hasVariants && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-neutral-300 mb-3">Choose size</h3>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                {variantsUI.map((v) => {
                  const active = selected?.id === v.id;
                  const vSold = v.soldOut;
                  const subs = Number(v.subscribers ?? 0);
                  const showRestockSoon = vSold && subs > 0;

                  const aria = `${v.label} — $${v.price.toFixed(2)}${v.isPopular ? " (Popular)" : ""}${
                    vSold ? " (Sold out)" : ""
                  }${showRestockSoon ? " (Restock soon)" : ""}`;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(v.id);
                        setShimmerId(v.id);
                      }}
                      className={[
                        "relative rounded-xl px-2.5 py-2 text-left w-full min-w-0",
                        "border border-[var(--brand-gold)]",
                        "bg-black/35 hover:bg-black/45",
                        "transition-transform duration-200 ease-out hover:-translate-y-[2px]",
                        active
                          ? "shadow-[0_0_0_1px_rgba(212,175,55,0.35),0_0_28px_rgba(212,175,55,0.25)]"
                          : "shadow-[0_0_0_1px_rgba(212,175,55,0.18),0_0_18px_rgba(0,0,0,0.35)]",
                        vSold ? "opacity-60" : "",
                      ].join(" ")}
                      title={vSold ? "Sold out" : undefined}
                      aria-pressed={active}
                      aria-label={aria}
                    >
                      {active ? <span className="leaflyx-shimmer leaflyx-shimmer-loop" /> : null}
                      {shimmerId === v.id ? <span className="leaflyx-shimmer leaflyx-shimmer-once" /> : null}

                      {v.isPopular && !vSold && (
                        <span
                          className="
                            absolute
                            -top-4
                            -right-2
                            px-2
                            py-[2px]
                            text-[12px]
                            font-semibold
                            tracking-wide
                            rounded-full
                            bg-[var(--brand-gold)]
                            text-black
                            border
                            border-black/80
                            shadow-[0_6px_14px_rgba(212,175,55,0.45)]
                            whitespace-nowrap
                            leading-none
                          "
                        >
                          Popular
                        </span>
                      )}

                      {showRestockSoon && (
                        <span
                          className="
                            absolute -bottom-5 left-1/2 -translate-x-1/2
                            inline-flex items-center justify-center
                            rounded-full
                            px-2 py-[3px]
                            text-[10px] font-semibold tracking-wide
                            leading-none
                            bg-black/90 text-[var(--brand-gold)]
                            border border-[var(--brand-gold)]/40
                            shadow-[0_10px_28px_rgba(0,0,0,0.45)]
                            whitespace-nowrap
                          "
                        >
                          Restock Soon
                        </span>
                      )}

                      <div className="text-[13px] sm:text-sm font-extrabold text-[var(--brand-gold)] leading-tight">
                        {v.label}
                      </div>

                      <div className="text-[11px] sm:text-xs font-semibold leading-tight">
                        <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
                          ${v.price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="text-2xl font-semibold text-white">${displayPrice.toFixed(2)}</div>

            {!canAddToCart ? (
              <BackInStockForm
                productId={product.id}
                selectedLabel={hasVariants ? selectedVariantKeyForRequest : null}
                variants={
                  hasVariants
                    ? variantsUI.map((v) => ({
                        id: canonVariant(v.id) ?? v.id,
                        label: v.label,
                        soldOut: v.soldOut,
                      }))
                    : []
                }
              />
            ) : (
              <AddToCartButton
                id={product.id}
                name={hasVariants && selected ? `${product.name} — ${selected.label}` : product.name}
                image={srcOf(primaryImg)}
                price={displayPrice}
                variant={selected?.label ?? undefined}
                quantity={1}
              />
            )}

            {product.coaUrl ? <CoaVerifiedPill href={product.coaUrl} className="ml-2" /> : null}
          </div>

          <CompareToggle
            item={{
              id: product.id,
              slug,
              name: product.name,
              potency: product.potency ?? null,
              type: (product as any).type ?? null,
            }}
          />

          <ShippingExpectations />

          <div className="mt-6 space-y-2 text-sm text-neutral-300">
            <p>Legal &amp; compliance: Verify local regulations before ordering. COA available for each batch.</p>
            <p>Returns: 30-day returns on unopened items.</p>
          </div>
        </div>
      </div>

      {educationSlot ? (
        <div className="max-w-5xl mx-auto px-4 -mt-2">{educationSlot}</div>
      ) : null}

      {/* ✅ Customers also viewed ONLY */}
      {alsoViewed.length ? (
        <div className="max-w-5xl mx-auto px-4">
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white">Customers also viewed</h2>
            <p className="mt-1 text-sm text-white/65">Similar picks in the same vibe — curated for you.</p>

            <div
              className="mt-4 rounded-3xl p-4"
              style={{
                border: "3px solid var(--brand-gold)",
                background: "rgba(0,0,0,0.25)",
                boxShadow: "0 0 38px rgba(212,175,55,0.12)",
              }}
            >
              <div className="flex gap-4 overflow-x-auto pb-3">
                {alsoViewed.map((p: any) => (
                  <ProductCardMini key={String(p.id)} p={p} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reviews */}
      <div id="reviews" className="max-w-5xl mx-auto px-4">
        <div className="mt-14">
          <Reviews productSlug={slug} onStats={handleReviewStats} />
          <div id="write-review" className="mt-8">
            <ReviewForm productSlug={slug} />
          </div>
        </div>
      </div>

      <ProductLDJson productSlug={slug} name={product.name} image={srcOf(primaryImg)} sku={(product as any).id ?? slug} />
    </>
  );
}
