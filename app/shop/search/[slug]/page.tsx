// app/shop/search/[slug]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Container from "@/components/Container";
import PageHeading from "@/components/PageHeading";
import ProductGrid from "@/components/ProductGrid";

import { SEARCH_LANDINGS, SEARCH_LANDING_SLUGS } from "@/lib/search-landings";
import { filterCatalogForLanding } from "@/lib/search-landings.server";
import { getInventoryOverlayForCatalogProducts } from "@/lib/inventory.server";

type Props = { params: { slug: string } };

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * ✅ Prebuild known slugs at deploy time (Vercel).
 * Helps SEO + performance for your curated landings.
 */
export function generateStaticParams() {
  return SEARCH_LANDING_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = String(params.slug ?? "").toLowerCase();
  const config = SEARCH_LANDINGS[slug];
  if (!config) return { title: "Not found · Leaflyx" };

  const title = `${config.title} · Leaflyx`;
  const description = config.description;
  const canonical = `${baseUrl()}/shop/search/${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

function FaqJsonLd({ faq }: { faq: { q: string; a: string }[] }) {
  if (!faq?.length) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function SearchLandingPage({ params }: Props) {
  const slug = String(params.slug ?? "").toLowerCase();
  const config = SEARCH_LANDINGS[slug];
  if (!config) notFound();

  const filtered = filterCatalogForLanding(config);

  // ✅ Inventory overlay keeps stock accurate (DB wins, catalog fallback)
  const inventoryMap = await getInventoryOverlayForCatalogProducts(filtered);

  return (
    <Container>
      <div className="pt-6">
        {/* ✅ FAQ rich results eligibility */}
        {Array.isArray(config.faq) && config.faq.length ? <FaqJsonLd faq={config.faq} /> : null}

        {config.eyebrow ? (
          <div className="mb-2 text-xs tracking-wide uppercase text-white/55">
            {config.eyebrow}
          </div>
        ) : null}

        <PageHeading>{config.title}</PageHeading>

        <div
          className="
            mt-4 rounded-3xl
            border border-white/10
            bg-black/25 backdrop-blur-md
            shadow-[0_18px_60px_rgba(0,0,0,0.35),inset_0_1px_14px_rgba(255,255,255,0.04)]
            p-5 md:p-6
          "
        >
          <div className="max-w-3xl">
            <p className="text-sm text-white/75">{config.description}</p>

            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-white/75">
              {config.seoIntro?.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>

        {filtered.length ? (
          <div className="mt-8">
            <ProductGrid products={filtered} inventoryMap={inventoryMap} includeTags={[]} />
          </div>
        ) : (
          <div
            className="
              mt-8 rounded-3xl p-10 text-center
              border border-dashed border-white/15
              bg-black/20
              text-white/65
            "
          >
            No products match this collection yet.
            <div className="mt-2 text-sm text-white/50">
              Add more catalog items or adjust this landing’s filters in{" "}
              <span className="text-[var(--brand-gold)]">lib/search-landings.ts</span>.
            </div>
          </div>
        )}

        {Array.isArray(config.faq) && config.faq.length ? (
          <div className="mt-10">
            <h2 className="text-xl font-semibold">
              <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
                FAQs
              </span>
            </h2>

            <div className="mt-4 grid gap-3">
              {config.faq.map((item, i) => (
                <details
                  key={i}
                  className="
                    rounded-3xl p-5
                    border border-white/10
                    bg-black/20
                    hover:bg-black/25
                    transition
                  "
                >
                  <summary className="cursor-pointer list-none font-medium text-white/85">
                    {item.q}
                  </summary>
                  <div className="mt-3 text-sm leading-relaxed text-white/70">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Container>
  );
}
