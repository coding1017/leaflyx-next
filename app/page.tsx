import ProductGrid from "@/components/ProductGrid";
import TrustBar from "@/components/TrustBar";
import ConstellationHero from "@/components/home/ConstellationHero";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div>
      {/* ================= HERO (KINETIC) ================= */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-6">
        <ConstellationHero />
      </div>

      {/* ================= TRUST BAR ================= */}
      <div className="max-w-6xl mx-auto px-4">
        <TrustBar className="mt-4 mb-10" />
      </div>

      {/* ================= FEATURED ================= */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Featured</h2>
          <a href="/products" className="text-sm underline">
            View all products
          </a>
        </div>
        <ProductGrid limit={6} />
      </section>
    </div>
  );
}
