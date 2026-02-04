// app/coa/page.tsx
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Certificates of Analysis — Leaflyx",
  description: "Lab results and COAs for Leaflyx THCA products.",
};

const HERO_IMAGES = ["/coa-hero1.png", "/coa-hero2.png", "/coa-hero3.png"];

// ✅ Match About/FAQ ribbon pattern exactly
const RIBBON_BG = "/coa-bg.png";

export default function COAPage() {
  return (
    <main className="relative max-w-5xl mx-auto px-4 md:px-6 pt-6 md:pt-8 pb-10 md:pb-12 text-white">
      {/* ✅ Background ribbon (EXACT match to About/FAQ sizing + placement) */}
      <div
        className="
          absolute md:fixed
          top-0 left-1/2 -translate-x-1/2 -z-10
          w-[110vw] sm:w-[1200px] md:w-[1600px]
          h-[80vh] sm:h-[100vh] md:h-[130vh]
          pointer-events-none
        "
      >
        <div
          className="
            absolute inset-0
            bg-no-repeat bg-center
            opacity-45
            bg-[length:85%]
            sm:bg-[length:80%]
            md:bg-[length:75%]
          "
          style={{ backgroundImage: `url('${RIBBON_BG}')` }}
        />
      </div>

      {/* Title */}
      <h1
        className="
          text-4xl md:text-5xl font-extrabold text-center mb-4
          text-white
          animate-heroGoldPulse
        "
      >
        Certificates of Analysis
      </h1>

      {/* Subtitle */}
      <p
        className="
          text-center text-white mb-4 md:mb-6 px-2
          text-base md:text-lg
          animate-strongGoldGlow
        "
      >
        Each Leaflyx product is backed by third-party lab testing to verify potency and compliance.
      </p>

      {/* ===== COA Section ===== */}
      <section className="relative isolate mb-12">
        {/* Hero Carousel */}
        <div
          className="relative rounded-[24px] md:rounded-[28px] overflow-hidden
            border border-[rgba(212,175,55,0.45)]
            shadow-[0_12px_35px_rgba(0,0,0,0.35)]
            mb-4 aspect-[16/9] sm:aspect-[16/8] md:aspect-[16/7] slideshow"
        >
          {HERO_IMAGES.map((src, i, arr) => (
            <Image
              key={src}
              src={src}
              alt={`COA hero ${i + 1}`}
              fill
              priority={i === 0}
              className="absolute inset-0 object-cover slide"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 960px"
              style={{
                animationDuration: `${arr.length * 5}s`,
                animationDelay: `${i * 5}s`,
              }}
            />
          ))}

          {/* Gold vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none
              bg-[radial-gradient(120%_80%_at_10%_10%,rgba(212,175,55,0.25),transparent_55%)]
              opacity-70"
          />
        </div>

        {/* Indicator dots */}
        <div className="flex justify-center items-center gap-2 mb-3 md:mb-5 dots">
          {HERO_IMAGES.map((_, i, arr) => (
            <span
              key={i}
              className="dot block rounded-full"
              style={{
                animationDuration: `${arr.length * 5}s`,
                animationDelay: `${i * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Categorized COA sections */}
        {[
          {
            category: "Flower",
            items: [
              { name: "cherry lemonade", pdf: "/coas/cherry-lemonade.pdf" },
              { name: "Chocolate Mintz", pdf: "/coas/chocolate-mintz.pdf" },
              { name: "ice cream cake", pdf: "/coas/ice-cream-cake.pdf" },
              { name: "modified grapes", pdf: "/coas/modified-grapes.pdf" },
              { name: "wedding cake", pdf: "/coas/wedding-cake.pdf" },
            ],
          },
          {
            category: "Edibles",
            items: [
              { name: "Blueberry Gummies", pdf: "/coas/blueberry-gummies.pdf" },
              { name: "THCA Brownie Bites", pdf: "/coas/brownie-bites.pdf" },
            ],
          },
          {
            category: "Concentrates",
            items: [
              { name: "Live Resin", pdf: "/coas/live-resin.pdf" },
              { name: "Hash Rosin", pdf: "/coas/hash-rosin.pdf" },
            ],
          },
        ].map((group) => (
          <div key={group.category} className="mb-12 md:mb-16">
            <h2
              className="
                text-2xl md:text-4xl font-extrabold text-center
                mb-4 md:mb-6
                text-white
                [text-shadow:_0_0_12px_rgba(212,175,55,0.9),_0_0_28px_rgba(212,175,55,0.85),_0_0_56px_rgba(212,175,55,0.75)]
                drop-shadow-[0_0_40px_rgba(212,175,55,0.8)]
                tracking-wide
              "
            >
              {group.category}
            </h2>

            <div className="h-[2px] w-16 md:w-24 mx-auto mb-6 md:mb-10 bg-[var(--brand-gold)] opacity-80 rounded-full shadow-[0_0_16px_rgba(212,175,55,0.8)]" />

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {[...group.items]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <div
                    key={c.name}
                    className="relative overflow-hidden
                      rounded-2xl border border-[rgba(212,175,55,0.45)]
                      p-5 md:p-6 text-center text-white
                      bg-[linear-gradient(135deg,rgba(212,175,55,0.22)_0%,rgba(25,25,25,0.45)_100%)]
                      backdrop-blur-md
                      shadow-[0_0_25px_rgba(212,175,55,0.18)]
                      hover:bg-[linear-gradient(135deg,rgba(212,175,55,0.35)_0%,rgba(25,25,25,0.6)_100%)]
                      hover:shadow-[0_0_55px_rgba(212,175,55,0.5)]
                      transition-all duration-300"
                  >
                    <h3 className="font-semibold text-white mb-3 md:mb-4 capitalize tracking-wide">
                      {c.name}
                    </h3>
                    <Link
                      href={c.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block min-h-[44px] px-5 py-2 text-sm md:text-[15px] font-medium rounded-full
                        bg-[var(--brand-gold)] text-black
                        border border-[rgba(212,175,55,0.7)]
                        shadow-[0_0_10px_rgba(212,175,55,0.35)]
                        hover:opacity-90 transition"
                    >
                      View COA
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
