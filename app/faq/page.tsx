// app/faq/page.tsx
import FAQCategoriesAccordion from "@/components/faq/FAQCategoriesAccordion";

export const metadata = {
  title: "FAQ — Leaflyx",
  description:
    "Quick answers about orders, shipping, lab testing, products, and support.",
};

// ✅ Use the SAME ribbon background as About (swap later if you want a unique FAQ image)
const RIBBON_BG = "/faq/faq-bg.png";

export default function FAQPage() {
  return (
    <main className="relative max-w-5xl mx-auto px-4 md:px-6 pt-6 md:pt-8 pb-10 md:pb-12 text-white">
      {/* ✅ Background ribbon (match About) */}
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

      {/* H1 (match About) */}
      <h1
        className="
          text-4xl md:text-5xl font-extrabold text-center mb-4
          text-white
          animate-heroGoldPulse
        "
      >
        FAQ
      </h1>

      {/* Subtitle (match About) */}
      <p
        className="
          text-center text-white mb-6 md:mb-8 px-2
          text-base md:text-lg
          animate-strongGoldGlow
        "
      >
        Quick answers about orders, shipping, lab testing, products, and support.
      </p>

      {/* FAQ content */}
      <section className="relative isolate">
        <FAQCategoriesAccordion />
      </section>

      <p className="pt-8 text-center text-xs text-white/40">
        These statements have not been evaluated by the FDA. Products are not intended to diagnose,
        treat, cure, or prevent any disease.
      </p>
    </main>
  );
}
