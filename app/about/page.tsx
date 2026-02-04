// app/about/page.tsx
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "About Us — Leaflyx",
  description:
    "Learn what THCA is, how hemp-derived cannabinoids can be legal under federal law, and how Leaflyx approaches quality, testing, and compliance.",
};

// ✅ About carousel images (replace COA heroes)
const HERO_IMAGES = [
  "/about/hero-01.png",
  "/about/hero-02.png",
  "/about/hero-03.png",
];

// ✅ About ribbon background image (same placement as COA ribbon, different picture)
const RIBBON_BG = "/about/about-bg.png";

type Section = {
  title: string;
  body: React.ReactNode;
};

const SECTIONS: Section[] = [
  {
    title: "Mission",
    body: (
      <p className="text-white/80">
        At Leaflyx, we believe THCA should be experienced with confidence,
        style, and peace of mind. Our mission is to redefine what it means to
        shop for THCA products by combining consistently premium, lab-tested
        quality with a modern, elevated shopping experience.
      </p>
    ),
  },
  {
    title: "Our Commitment to Quality",
    body: (
      <p className="text-white/80">
        Every flower, vape, and edible we carry is carefully curated to meet the
        highest standards of potency, purity, and consistency. Every batch we
        sell comes with a published Certificate of Analysis (COA), so you always
        know exactly what you’re consuming—because our customers deserve nothing
        less.
      </p>
    ),
  },
  {
    title: "Why Choose Leaflyx",
    body: (
      <ul className="list-disc space-y-2 pl-5 text-white/80">
        <li>72 hour shipping guarantee</li>
        <li>Certificate of Analysis (COA) with every order</li>
        <li>Discreet shipping</li>
      </ul>
    ),
  },
  {
    title: "What Is THCA?",
    body: (
      <div className="space-y-3">
        <p className="text-white/80">
          THCA (tetrahydrocannabinolic acid) is a naturally occurring cannabinoid
          found in raw cannabis. It’s the precursor to Delta-9 THC, but in its
          original form THCA is not intoxicating.
        </p>
        <p className="text-white/80">
          When THCA is heated (smoked, vaped, or cooked), it can convert into
          Delta-9 THC through a process called decarboxylation. That’s why THCA
          flower can feel similar to traditional cannabis when used with heat.
        </p>
      </div>
    ),
  },
  {
    title: "How Can THCA Be Legal?",
    body: (
      <div className="space-y-3">
        <p className="text-white/80">
          Under the 2018 Farm Bill, “hemp” is cannabis that contains no more than
          0.3% Delta-9 THC by dry weight. Many hemp-derived products are legal
          federally when they meet that standard.
        </p>
        <p className="text-white/80">
          THCA is not the same molecule as Delta-9 THC until it’s heated. That’s
          why some products can be federally compliant based on Delta-9 limits
          while still containing significant THCA.
        </p>
        <p className="text-white/60">
          Important: State laws vary. Some states restrict certain hemp
          cannabinoids or apply different testing standards.
        </p>
      </div>
    ),
  },
  {
    title: "Testing, COAs, and Transparency",
    body: (
      <ul className="list-disc space-y-2 pl-5 text-white/80">
        <li>
          Every batch is supported by third-party lab testing (potency and
          screening for common contaminants).
        </li>
        <li>
          COAs are available so you can verify cannabinoid content and review
          results before you buy.
        </li>
        <li>
          We aim for clear labeling and accurate product information—no guessing
          games.
        </li>
      </ul>
    ),
  },
  {
    title: "Drug Test Warning",
    body: (
      <p className="text-white/80">
        If you are drug tested, avoid THCA products. Once THCA converts to THC
        (especially when heated), it can produce metabolites that may trigger a
        positive result on common screening panels.
      </p>
    ),
  },
  {
    title: "FAQ Quick Hits",
    body: (
      <div className="space-y-4">
        <QA
          q="Will THCA get me high?"
          a="Not in raw form. With heat, THCA can convert into Delta-9 THC, which is intoxicating."
        />
        <QA
          q="Is THCA the same as Delta-9 THC?"
          a="No. THCA is the precursor to Delta-9 THC and can convert into it when heated."
        />
        <QA
          q="Is it legal in my state?"
          a="Federal hemp standards exist, but state rules differ. Always check local laws before ordering."
        />
        <QA
          q="Do you provide COAs?"
          a="Yes. We publish COAs so you can verify what you’re buying."
        />

        <p className="pt-2 text-sm text-white/60">
          Want the full version? Visit our{" "}
          <Link
            href="/faq"
            className="text-[var(--brand-gold)] underline decoration-[rgba(212,175,55,0.45)] underline-offset-4 hover:decoration-[rgba(212,175,55,0.85)]"
          >
            FAQ page
          </Link>
          .
        </p>
      </div>
    ),
  },
];

export default function AboutPage() {
  return (
    <main className="relative max-w-5xl mx-auto px-4 md:px-6 pt-6 md:pt-8 pb-10 md:pb-12 text-white">
      {/* H1 (COA style: centered + breathing glow) */}
      <h1
        className="
          text-4xl md:text-5xl font-extrabold text-center mb-4
          text-white
          animate-heroGoldPulse
        "
      >
        About Leaflyx
      </h1>

      {/* Subtitle (COA style: stronger breathing gold haze) */}
      <p
        className="
          text-center text-white mb-4 md:mb-6 px-2
          text-base md:text-lg
          animate-strongGoldGlow
        "
      >
        We believe premium THCA should be easy to understand and effortless
        to buy—so we built Leaflyx, a modern shopping experience for small batch, lab-tested
        THCA goods with transparent quality and fast delivery.
      </p>

      {/* ✅ Background ribbon (same as COA, just a different image) */}
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

      {/* Hero Carousel (same as COA) */}
      <section className="relative isolate mb-10 md:mb-12">
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
              alt={`About hero ${i + 1}`}
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

        {/* Indicator dots (same as COA) */}
        <div className="flex justify-center items-center gap-2 mb-6 md:mb-8 dots">
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

        {/* About sections as COA-style grouped blocks */}
        {SECTIONS.map((s) => (
          <div key={s.title} className="mb-12 md:mb-16">
            {/* H2 (COA style: centered + strong gold glow) */}
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
              {s.title}
            </h2>

            <div className="h-[2px] w-16 md:w-24 mx-auto mb-6 md:mb-10 bg-[var(--brand-gold)] opacity-80 rounded-full shadow-[0_0_16px_rgba(212,175,55,0.8)]" />

            {/* Content card */}
            <div
              className="
                relative overflow-hidden
                rounded-2xl border border-[rgba(212,175,55,0.45)]
                p-6 md:p-8
                bg-[linear-gradient(135deg,rgba(212,175,55,0.18)_0%,rgba(25,25,25,0.42)_100%)]
                backdrop-blur-md
                shadow-[0_0_25px_rgba(212,175,55,0.16)]
              "
            >
              <div className="text-[15.5px] md:text-[16px] leading-relaxed">
                {s.body}
              </div>
            </div>
          </div>
        ))}

        <p className="pt-4 text-center text-xs text-white/40">
          These statements have not been evaluated by the FDA. Products are not intended to diagnose,
          treat, cure, or prevent any disease.
        </p>
      </section>
    </main>
  );
}

/* Helpers */

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <div className="text-white/90">
        <span className="font-semibold">{q}</span>
      </div>
      <div className="mt-1 text-[15.5px] leading-relaxed text-white/75">{a}</div>
    </div>
  );
}
