// app/shop/[category]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Container from "@/components/Container";
import ProductGrid from "@/components/ProductGrid";
import SectionH2 from "@/components/SectionH2";
import { getMergedCatalogProducts } from "@/lib/catalog-merged.server";
import { getInventoryOverlayForCatalogProducts } from "@/lib/inventory.server";

function normalizeTag(s: string) {
  return decodeURIComponent(String(s || ""))
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

function productHasTag(p: any, tag: string) {
  const t = normalizeTag(tag);

  const cat = p?.category ? normalizeTag(p.category) : "";
  const tags: string[] = Array.isArray(p?.tags) ? p.tags.map((x: any) => normalizeTag(x)) : [];
  const subs: string[] = Array.isArray(p?.subcategories)
    ? p.subcategories.map((x: any) => normalizeTag(x))
    : [];

  const tNoDash = t.replace(/-/g, "");
  const hay = [cat, ...tags, ...subs].filter(Boolean);

  return hay.some((h) => h === t || h.replace(/-/g, "") === tNoDash);
}

function prettyTitle(tag: string) {
  const s = normalizeTag(tag).replace(/-/g, " ");
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const tag = normalizeTag(params.category);

  const products = await getMergedCatalogProducts();
  const filtered = (products as any[]).filter((p) => productHasTag(p, tag));

  const inventoryMap = await getInventoryOverlayForCatalogProducts(filtered);

  return (
    <Container>
      <div className="pt-6">
        <SectionH2 align="left" className="mt-2">
          {prettyTitle(tag)}
        </SectionH2>

        <ProductGrid products={filtered} inventoryMap={inventoryMap} includeTags={[tag]} />
      </div>
    </Container>
  );
}
