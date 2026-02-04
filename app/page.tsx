import Image from "next/image";
import { ProductGrid } from "@/components/ProductGrid";
import TrustBar from "@/components/TrustBar";

export default function HomePage() {
  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-[700px] rounded-full bg-gradient-to-br from-yellow-400/10 via-emerald-500/10 to-yellow-400/10 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-16 pb-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
                Feel-good{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-emerald-300 to-yellow-300">
                  THCA
                </span>{" "}
                delivered fast.
              </h1>
              <p className="mt-4 text-neutral-300 text-lg">
                Curated flower, vapes, and edibles with lab-tested potency. Clean
                design. Great vibes.
              </p>
            </div>

            {/* Hero image */}
            <div className="relative">
              <div className="glow-card aspect-[4/3] rounded-3xl overflow-hidden relative">
                <Image
                  src="/hero_4x3.png"
                  alt="Leaflyx hero — greenhouse with Leaflyx seal"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

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
