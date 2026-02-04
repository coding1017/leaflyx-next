// app/shop/[category]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Container from "@/components/Container";
import ProductGrid from "@/components/ProductGrid";
import SectionH2 from "@/components/SectionH2";
import { products } from "@/lib/products";
import { getInventoryOverlayForCatalogProducts } from "@/lib/inventory.server";

function normalizeTag(s: string) {
  return decodeURIComponent(s).trim().toLowerCase();
}

function productHasTag(p: any, tag: string) {
  const cat = p?.category ? String(p.category).toLowerCase() : "";
  const tags: string[] = Array.isArray(p?.tags) ? p.tags.map((x: any) => String(x).toLowerCase()) : [];
  return cat === tag || tags.includes(tag);
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const tag = normalizeTag(params.category);

  const filtered = (products as any[]).filter((p) => productHasTag(p, tag));

  // ✅ Prisma overlay for this grid
  const inventoryMap = await getInventoryOverlayForCatalogProducts(filtered);

  return (
    <Container>
      <div className="pt-6">
        <SectionH2 align="left" className="mt-2">
          {tag.charAt(0).toUpperCase() + tag.slice(1)}
        </SectionH2>

        {/* ✅ Pass real products + inventory overlay */}
        <ProductGrid products={filtered} inventoryMap={inventoryMap} />
      </div>
    </Container>
  );
}
