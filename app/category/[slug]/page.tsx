// app/category/[slug]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Container from "@/components/Container";
import PageHeading from "@/components/PageHeading";
import ProductGrid from "@/components/ProductGrid";

import { products } from "@/lib/products";
import { getInventoryOverlayForCatalogProducts } from "@/lib/inventory.server";

// Allowed category slugs (case-insensitive)
const SLUGS = [
  "flower",
  "smalls",
  "edibles",
  "vapes",
  "beverages",
  "pre-rolls",
  "concentrates",
] as const;

type CategorySlug = (typeof SLUGS)[number];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

function prettyTitle(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Match slug against:
// - p.category
// - p.tags
// - p.subcategories
// Handles things like "pre-rolls" vs "pre rolls" vs "prerolls"
function normalizeTag(s: string) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

function hasTag(p: any, slug: string) {
  const needle = normalizeTag(slug);

  const cat = p?.category ? normalizeTag(p.category) : "";
  const tags: string[] = Array.isArray(p?.tags) ? p.tags.map((x: any) => normalizeTag(x)) : [];
  const subs: string[] = Array.isArray(p?.subcategories) ? p.subcategories.map((x: any) => normalizeTag(x)) : [];

  // also allow matching without hyphens ("pre-rolls" vs "prerolls")
  const needleNoDash = needle.replace(/-/g, "");
  const hay = [cat, ...tags, ...subs].filter(Boolean);
  return hay.some((h) => h === needle || h.replace(/-/g, "") === needleNoDash);
}

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug.toLowerCase();
  const valid = SLUGS.includes(slug as CategorySlug);
  const title = prettyTitle(valid ? slug : "Category");

  return {
    title: `${title} · Leaflyx`,
    description: `Browse ${title} at Leaflyx.`,
    openGraph: {
      title: `${title} · Leaflyx`,
      description: `Browse ${title} at Leaflyx.`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const slug = params.slug.toLowerCase();
  if (!SLUGS.includes(slug as CategorySlug)) notFound();

  const title = prettyTitle(slug);

  // ✅ Use catalog products, not listProducts()
  const filtered = (products as any[]).filter((p) => hasTag(p, slug));

  // ✅ Prisma overlay for this category grid
  const inventoryMap = await getInventoryOverlayForCatalogProducts(filtered);

  return (
    <Container>
      <PageHeading>{title}</PageHeading>

      {/* ✅ Pass real products + inventory overlay */}
      <ProductGrid products={filtered} inventoryMap={inventoryMap} includeTags={[slug]} />
    </Container>
  );
}
