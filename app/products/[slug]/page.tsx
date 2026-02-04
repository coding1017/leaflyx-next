// app/products/[slug]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import { prisma } from "@/lib/prisma";
import { products, type Product as LegacyProduct } from "@/lib/products";
import ProductDetailClient, { type VariantUI } from "@/components/ProductDetailClient";

type PageParams = { params: { slug: string } };
type PageProps = PageParams & { searchParams?: { variant?: string } };

type PI = string | StaticImageData;

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function findProductBySlugOrId(slug: string): LegacyProduct | undefined {
  const s = slug.toLowerCase();
  return products.find((p) => {
    const ps = p?.slug ? String(p.slug).toLowerCase() : "";
    const pid = p?.id ? String(p.id).toLowerCase() : "";
    return ps === s || pid === s;
  });
}

/**
 * ✅ SEO: For /products/[slug], we set canonical to /shop/[slug]
 * and mark this legacy route as noindex so Google doesn’t index duplicates.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const slug = String(params.slug ?? "").toLowerCase();
  const product = findProductBySlugOrId(slug);

  if (!product) {
    return { title: "Not found · Leaflyx" };
  }

  const canonical = `${baseUrl()}/shop/${encodeURIComponent(String(product.slug))}`;

  return {
    title: `${product.name} · Leaflyx`,
    description: `Buy ${product.name} at Leaflyx. Lab-tested potency, premium quality.`,
    alternates: { canonical },

    // ✅ IMPORTANT: prevent duplicate indexing of /products/*
    robots: {
      index: false,
      follow: true,
    },

    openGraph: {
      title: `${product.name} · Leaflyx`,
      description: `Buy ${product.name} at Leaflyx.`,
      url: canonical,
    },
  };
}

function canonVariant(input: unknown): string | null {
  if (input === null || input === undefined) return null;
  let s = String(input).trim();
  if (!s) return null;

  const m = s.match(/\(([^)]+)\)/);
  if (m?.[1]) s = m[1].trim();

  s = s.replace(/\s+/g, "").toLowerCase();
  return s || null;
}

async function getSubscribersByVariant(productId: string) {
  const subsByVariant: Record<string, number> = {};
  const MODEL_NAME: string | null = null;

  const anyPrisma = prisma as any;

  const model =
    (MODEL_NAME ? anyPrisma[MODEL_NAME] : null) ||
    anyPrisma.backInStockRequest ||
    anyPrisma.backInStock ||
    anyPrisma.restockRequest ||
    anyPrisma.restockSubscription ||
    null;

  if (!model?.groupBy) return subsByVariant;

  try {
    const rows = await model.groupBy({
      by: ["variant"],
      where: { productId },
      _count: { _all: true },
    });

    for (const r of rows as any[]) {
      const v = r?.variant == null ? null : String(r.variant).toLowerCase();
      if (!v) continue;
      subsByVariant[v] = Number(r?._count?._all ?? 0);
    }
  } catch {}

  return subsByVariant;
}

/** Collapsible THCA section (server-safe: details/summary) */
function WhatIsTHCADetails() {
  return (
    <section
      className="
        rounded-2xl
        border-2 border-[var(--brand-gold)]
        bg-black/30 backdrop-blur
        shadow-[0_0_0_1px_rgba(212,175,55,0.35),0_0_42px_rgba(212,175,55,0.35),0_18px_55px_rgba(0,0,0,0.45)]
      "
      aria-label="THCA education"
    >
      <details className="group">
        <summary
          className="
            list-none cursor-pointer select-none
            flex items-center justify-between gap-4
            px-5 py-4
            rounded-2xl
            transition
          "
        >
          <div className="min-w-0">
            <h3 className="text-[15px] sm:text-[16px] font-semibold tracking-wide">
              <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">
                What is THCA?
              </span>
            </h3>

            <p className="mt-1 text-[13px] sm:text-[14px] font-semibold text-[var(--brand-gold)]">
              Quick clarity on what it is and why it can be sold legally.
            </p>
          </div>

          <span
            className="
              shrink-0 inline-flex items-center justify-center
              h-11 w-11 rounded-full
              border-2 border-[var(--brand-gold)]
              bg-black/40
              shadow-[0_0_18px_rgba(212,175,55,0.30)]
              transition
            "
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-[var(--brand-gold)] transition-transform duration-200 group-open:rotate-180"
            >
              <path
                fill="currentColor"
                d="M12 15.5a1 1 0 0 1-.7-.29l-6-6a1 1 0 1 1 1.4-1.42L12 13.1l5.3-5.3a1 1 0 0 1 1.4 1.42l-6 6a1 1 0 0 1-.7.28Z"
              />
            </svg>
          </span>
        </summary>

        {/* EXPANDED CONTENT */}
        <div className="px-5 pb-5 pt-1 text-[15px] leading-relaxed">
          <div className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent opacity-90">
            <p>
              <span className="font-semibold text-[var(--brand-gold)]">THCA</span>{" "}
              (tetrahydrocannabinolic acid) is a naturally occurring cannabinoid found in raw hemp
              flower. On its own, THCA is <span className="font-semibold">non-intoxicating</span>.
              When heated (smoked, vaped, or baked), THCA can convert into THC through a process
              called{" "}
              <span className="font-semibold text-[var(--brand-gold)]">decarboxylation</span>.
            </p>

            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <p>
                <span className="font-semibold">Legality clarity:</span> Many hemp products are sold
                based on their compliance with the{" "}
                <span className="font-semibold text-[var(--brand-gold)]">2018 Farm Bill</span>{" "}
                definition of hemp (≤ 0.3% Δ9-THC by dry weight). Legality can vary by state and local
                rules.
              </p>
            </div>
          </div>

          <p className="mt-3 text-[13px] text-white/70">
            Not legal advice. Always review your local regulations. We provide third-party COAs so
            you can verify cannabinoid content.
          </p>
        </div>
      </details>
    </section>
  );
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const slug = params.slug.toLowerCase();
  const product = findProductBySlugOrId(slug);

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <p>Product not found.</p>
        <Link href="/products" className="underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  const invRows = await prisma.inventory.findMany({
    where: { productId: product.id },
    select: { variant: true, qty: true },
  });

  const qtyByVariant: Record<string, number> = {};
  let productLevelQty: number | null = null;

  for (const r of invRows) {
    if (r.variant == null) productLevelQty = r.qty;
    else qtyByVariant[String(r.variant).toLowerCase()] = r.qty;
  }

  const subsByVariant = hasVariants ? await getSubscribersByVariant(product.id) : {};

  const variantsUI: VariantUI[] = hasVariants
    ? product.variants!.map((v) => {
        const vid = String(v.id).toLowerCase();
        const dbQty = qtyByVariant[vid];
        const qty = typeof dbQty === "number" ? dbQty : (v.stock ?? 0);

        return {
          id: v.id,
          label: v.label,
          price: Number(v.price ?? product.price),
          isPopular: !!v.isPopular,
          qty,
          soldOut: qty <= 0,
          subscribers: Number(subsByVariant[vid] ?? 0),
        };
      })
    : [];

  const nonVariantQty = productLevelQty != null ? productLevelQty : (product.stock ?? 0);

  const wanted = canonVariant(searchParams?.variant);
  const wantedExists =
    hasVariants && wanted ? variantsUI.some((v) => canonVariant(v.id) === wanted) : false;

  const initialSelectedVariantId = hasVariants
    ? (wantedExists
        ? variantsUI.find((v) => canonVariant(v.id) === wanted)?.id
        : variantsUI.find((v) => v.qty > 0)?.id) ?? variantsUI[0]?.id
    : undefined;

  return (
    <ProductDetailClient
      slug={slug}
      product={product}
      hasVariants={hasVariants}
      variantsUI={variantsUI}
      nonVariantQty={nonVariantQty}
      initialSelectedVariantId={initialSelectedVariantId}
      educationSlot={<WhatIsTHCADetails />}
    />
  );
}
