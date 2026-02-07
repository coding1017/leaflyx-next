// app/products/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";


import Container from "@/components/Container";
import PageHeading from "@/components/PageHeading";
import SectionH2 from "@/components/SectionH2";
import ProductGrid from "@/components/ProductGrid";
import ResubscribedToast from "@/components/ResubscribedToast";
import { products } from "@/lib/products";
import { getInventoryOverlayForCatalogProducts } from "@/lib/inventory.server";

function hasAnyTag(p: any, tags: string[]) {
  const cat = p?.category ? String(p.category).toLowerCase() : "";
  const hay: string[] = [
    cat,
    ...(Array.isArray(p?.tags) ? p.tags.map((x: any) => String(x).toLowerCase()) : []),
    ...(Array.isArray(p?.subcategories)
      ? p.subcategories.map((x: any) => String(x).toLowerCase())
      : []),
  ].filter(Boolean);

  return tags.some((t) => hay.includes(String(t).toLowerCase()));
}

export default async function ProductsPage() {
  const flower = (products as any[]).filter((p) => hasAnyTag(p, ["flower"]));
  const edibles = (products as any[]).filter((p) =>
    hasAnyTag(p, ["edibles", "brownies", "cookies", "gummies", "syrups"])
  );
  const concentrates = (products as any[]).filter((p) =>
    hasAnyTag(p, ["concentrates", "live-resin", "hash-rosin", "bubble-hash"])
  );

  // one overlay per section (keeps it simple + fast enough)
  const [invFlower, invEdibles, invConcentrates] = await Promise.all([
    getInventoryOverlayForCatalogProducts(flower),
    getInventoryOverlayForCatalogProducts(edibles),
    getInventoryOverlayForCatalogProducts(concentrates),
  ]);

  return (
    <Container>
      {/* 🔔 Shows only when /products?resubscribed=1 (client-side) */}
      <ResubscribedToast />

      <div className="pt-6">
        <PageHeading>Shop</PageHeading>

        <SectionH2>Flower</SectionH2>
        <ProductGrid products={flower} inventoryMap={invFlower} includeTags={["flower"]} />

        <SectionH2>Edibles</SectionH2>
        <ProductGrid products={edibles} inventoryMap={invEdibles} includeTags={["edibles"]} />

        <SectionH2>Concentrates</SectionH2>
        <ProductGrid
          products={concentrates}
          inventoryMap={invConcentrates}
          includeTags={["concentrates"]}
        />
      </div>
    </Container>
  );
}
