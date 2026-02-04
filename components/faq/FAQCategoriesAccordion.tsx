// components/faq/FAQCategoriesAccordion.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type FAQItem = { q: string; a: string };
type FAQCategory = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
};

function IconOrders() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M7 8h10M7 12h10M7 16h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M6.5 3.8h11A2.5 2.5 0 0 1 20 6.3v11.4a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.7V6.3A2.5 2.5 0 0 1 6.5 3.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.7"
      />
    </svg>
  );
}
function IconShipping() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M3.8 7.5h10.4v9.2H3.8V7.5Z" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
      <path d="M14.2 10h3.3l2.7 3.2v3.5h-6V10Z" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
      <path
        d="M7.2 18.4a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM17.5 18.4a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function IconLab() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M9 3.8h6M10 3.8v5.1l-4.5 7.7a3.2 3.2 0 0 0 2.8 4.8h7.4a3.2 3.2 0 0 0 2.8-4.8L14 8.9V3.8"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.2 15.3h7.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconProducts() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M7.2 8.4 12 5.7l4.8 2.7v6.9L12 18l-4.8-2.7V8.4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.7"
        strokeLinejoin="round"
      />
      <path d="M12 5.7v12.3" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <path d="M7.2 8.4 12 11.1l4.8-2.7" stroke="currentColor" strokeWidth="1.2" opacity="0.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconSupport() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 21.2a8.8 8.8 0 1 0 0-17.6 8.8 8.8 0 0 0 0 17.6Z" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
      <path
        d="M8.8 10.8a3.2 3.2 0 1 1 6.4 0c0 2.4-3.2 2.2-3.2 4.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M12 17.8h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** ✅ Tightened copy: more trust/compliance tone, fewer absolutes, clearer expectations */
const FAQ: FAQCategory[] = [
  {
    id: "orders",
    title: "Orders",
    icon: <IconOrders />,
    items: [
      {
        q: "Can I change or cancel my order?",
        a: "If your order hasn’t been processed for shipment yet, we may be able to make changes. Reach out ASAP with your order number and requested update — we’ll confirm what’s still possible.",
      },
      {
        q: "Do you accept returns or refunds?",
        a: "Because these are consumable goods, we generally can’t accept returns once shipped. If your order arrives damaged, incorrect, or incomplete, contact us within 48 hours and we’ll resolve it.",
      },
      {
        q: "Where can I find my order status?",
        a: "You’ll receive an order confirmation by email, followed by a shipping confirmation with tracking once your package is handed to the carrier.",
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping",
    icon: <IconShipping />,
    items: [
      {
        q: "Do you ship nationwide?",
        a: "We ship within the U.S. where permitted. Some locations may have restrictions; if we can’t ship to an address, you’ll see that at checkout.",
      },
      {
        q: "How long does shipping take?",
        a: "Most orders ship in 1–2 business days. Delivery time varies by carrier and destination. Tracking is provided as soon as your label is created and scanned.",
      },
      {
        q: "Will my package be discreet?",
        a: "Yes. We use discreet outer packaging designed for privacy. Contents are securely packed to help prevent damage in transit.",
      },
    ],
  },
  {
    id: "testing",
    title: "Lab Testing & COAs",
    icon: <IconLab />,
    items: [
      {
        q: "Do you provide COAs?",
        a: "Yes — products are supported by third-party lab testing. COAs are available on the product page and/or in the COA section so you can review potency and compliance details before you buy.",
      },
      {
        q: "What does the lab test cover?",
        a: "COAs typically include cannabinoid potency and other compliance-relevant results based on the panel used. If you want help interpreting a report, contact us and we’ll point you to the right sections.",
      },
      {
        q: "How do I match a COA to my product?",
        a: "Look for batch/lot details on the product listing and packaging (when applicable) and match them to the COA details shown on the site.",
      },
    ],
  },
  {
    id: "products",
    title: "Products",
    icon: <IconProducts />,
    items: [
      {
        q: "What is THCA?",
        a: "THCA is a naturally occurring cannabinoid found in hemp/cannabis. When heated, it may convert to Delta-9 THC. We focus on clear product info, transparent testing, and consistent quality.",
      },
      {
        q: "Can THCA affect a drug test?",
        a: "Yes. If you are drug tested, avoid THCA products. Heating can convert THCA to THC and may produce metabolites that can trigger a positive result.",
      },
      {
        q: "How should I store my products?",
        a: "Store in a cool, dry place away from sunlight. For flower, airtight storage helps preserve aroma and freshness.",
      },
    ],
  },
  {
    id: "support",
    title: "Account & Support",
    icon: <IconSupport />,
    items: [
      {
        q: "Do I need an account to order?",
        a: "An account isn’t always required, but it helps you track orders and manage details more easily.",
      },
      {
        q: "How do I contact support?",
        a: "Use our contact form and include your order number (if you have one). We’ll respond as quickly as possible.",
      },
      {
        q: "Do you offer discounts or loyalty perks?",
        a: "We occasionally run limited promotions. Any active offers will appear on the site or at checkout.",
      },
    ],
  },
];

function makeKey(catId: string, idx: number) {
  return `${catId}:${idx}`;
}

function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [h, setH] = useState(0);

  useEffect(() => {
    if (!innerRef.current) return;
    const el = innerRef.current;

    const measure = () => setH(el.scrollHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div
      className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
      style={{ maxHeight: open ? h : 0, opacity: open ? 1 : 0 }}
      aria-hidden={!open}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

export default function FAQCategoriesAccordion() {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  /** ✅ active category as you scroll */
  const [activeCat, setActiveCat] = useState<string>("orders");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ;

    return FAQ.map((cat) => {
      const items = cat.items.filter(
        (it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
      );
      return { ...cat, items };
    }).filter((cat) => cat.items.length > 0);
  }, [query]);

  // If search filters out the open item, close it.
  useEffect(() => {
    if (!openKey) return;
    const exists = filtered.some((c) =>
      c.items.some((_, idx) => makeKey(c.id, idx) === openKey)
    );
    if (!exists) setOpenKey(null);
  }, [filtered, openKey]);

  /** ✅ Observe sections for active highlight (disabled during search to avoid weirdness) */
  useEffect(() => {
    if (query.trim()) return;

    const ids = FAQ.map((c) => c.id);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // choose the section that is most "in view"
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));

        if (visible[0]?.target?.id) {
          setActiveCat(visible[0].target.id);
        }
      },
      {
        // Tweak this if your header height changes:
        root: null,
        rootMargin: "-45% 0px -50% 0px",
        threshold: [0.1, 0.25, 0.4, 0.6],
      }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [query]);

  /** ✅ Chip click: set active and smooth scroll (and keep it crisp under the header) */
  function handleChipClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setActiveCat(id);

    const el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mx-auto">
      {/* Search panel (unchanged sizing; readable fonts) */}
      <div
        className="
          relative overflow-hidden
          rounded-2xl border border-[rgba(212,175,55,0.45)]
          p-5 md:p-6 mb-4
          bg-[linear-gradient(135deg,rgba(212,175,55,0.18)_0%,rgba(25,25,25,0.42)_100%)]
          backdrop-blur-md
          shadow-[0_0_25px_rgba(212,175,55,0.16)]
        "
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[15px] md:text-base font-semibold text-white/90">
              Find answers fast
            </div>
            <div className="mt-1 text-[13px] md:text-sm text-white/60">
              Search any question or keyword. Categories remain grouped below.
            </div>
          </div>

          <div className="relative w-full md:w-[360px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="
                w-full rounded-xl
                border border-[rgba(212,175,55,0.35)]
                bg-black/30
                px-4 py-2.5
                text-[15px] md:text-base
                text-white/85 placeholder:text-white/35
                outline-none
                focus:border-[rgba(212,175,55,0.55)]
                focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]
              "
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[13px] md:text-sm text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Clear search"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ✅ Sticky category chips */}
      <div
        className="
          sticky z-20
          top-[72px] md:top-[76px]
          -mx-2 px-2
          mb-8
        "
      >
        <div
          className="
            rounded-2xl
            border border-[rgba(212,175,55,0.30)]
            bg-[rgba(0,0,0,0.22)]
            backdrop-blur-md
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
            px-3 py-2
          "
        >
          <div className="flex flex-wrap gap-2">
            {FAQ.map((cat) => {
              const isActive = !query.trim() && activeCat === cat.id;

              return (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  onClick={(e) => handleChipClick(e, cat.id)}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border bg-black/25 px-3 py-1.5 transition",
                    "text-[13px] md:text-sm",
                    isActive
                      ? "text-white border-[rgba(212,175,55,0.70)] shadow-[0_0_0_3px_rgba(212,175,55,0.16)]"
                      : "text-white/75 border-[rgba(212,175,55,0.30)] hover:text-white hover:border-[rgba(212,175,55,0.55)] hover:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]",
                  ].join(" ")}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span className="text-[var(--brand-gold)] opacity-90">{cat.icon}</span>
                  <span>{cat.title}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-10">
        {filtered.length === 0 ? (
          <div
            className="
              rounded-2xl border border-[rgba(212,175,55,0.45)]
              p-8 text-center text-[15px] md:text-base text-white/70
              bg-[linear-gradient(135deg,rgba(212,175,55,0.18)_0%,rgba(25,25,25,0.42)_100%)]
              backdrop-blur-md
              shadow-[0_0_25px_rgba(212,175,55,0.16)]
            "
          >
            No results found for <span className="text-[var(--brand-gold)]">“{query}”</span>.
          </div>
        ) : (
          filtered.map((cat) => (
            <section key={cat.id} id={cat.id} className="scroll-mt-28">
              {/* Category title */}
              <div className="mb-4 md:mb-5">
                <div className="flex items-end justify-between gap-3">
                  <h2
                    className="
                      flex items-center gap-3
                      text-[28px] md:text-3xl font-extrabold
                      text-white
                      [text-shadow:_0_0_10px_rgba(212,175,55,0.85),_0_0_24px_rgba(212,175,55,0.75)]
                      drop-shadow-[0_0_30px_rgba(212,175,55,0.55)]
                      tracking-wide
                    "
                  >
                    <span className="text-[var(--brand-gold)] opacity-95">{cat.icon}</span>
                    {cat.title}
                  </h2>

                  <span className="text-[13px] md:text-sm text-white/50">
                    {cat.items.length} item{cat.items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="h-[2px] w-14 md:w-20 mt-3 bg-[var(--brand-gold)] opacity-80 rounded-full shadow-[0_0_16px_rgba(212,175,55,0.8)]" />
              </div>

              {/* Category card */}
              <div
                className="
                  relative overflow-hidden
                  rounded-2xl border border-[rgba(212,175,55,0.45)]
                  bg-[linear-gradient(135deg,rgba(212,175,55,0.14)_0%,rgba(25,25,25,0.38)_100%)]
                  backdrop-blur-md
                  shadow-[0_0_25px_rgba(212,175,55,0.16)]
                "
              >
                <ul className="divide-y divide-[rgba(212,175,55,0.18)]">
                  {cat.items.map((it, idx) => {
                    const key = makeKey(cat.id, idx);
                    const open = openKey === key;

                    return (
                      <li key={key} className="group">
                        <button
                          type="button"
                          onClick={() => setOpenKey(open ? null : key)}
                          className="
                            w-full text-left
                            flex items-center justify-between gap-4
                            px-5 py-4 md:px-6
                            hover:bg-white/[0.02]
                            transition
                          "
                          aria-expanded={open}
                          aria-controls={`faq-panel-${key}`}
                        >
                          <span className="text-[16.5px] md:text-[17.5px] font-semibold text-white/90">
                            {it.q}
                          </span>

                          <span
                            className="
                              relative h-8 w-8 shrink-0
                              rounded-full
                              border border-[rgba(212,175,55,0.45)]
                              bg-black/25
                              shadow-[0_0_14px_rgba(212,175,55,0.18)]
                              group-hover:shadow-[0_0_18px_rgba(212,175,55,0.28)]
                              transition
                            "
                            aria-hidden="true"
                          >
                            <span className="absolute left-1/2 top-1/2 h-[2px] w-4 -translate-x-1/2 -translate-y-1/2 bg-[var(--brand-gold)] opacity-90" />
                            <span
                              className="absolute left-1/2 top-1/2 h-4 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-[var(--brand-gold)] transition duration-200"
                              style={{ opacity: open ? 0 : 0.9 }}
                            />
                          </span>
                        </button>

                        <div id={`faq-panel-${key}`} className="px-5 pb-5 md:px-6">
                          <Collapsible open={open}>
                            {/* ✅ Your preferred premium answer card (unchanged) */}
                            <div
                              className="
                                relative mt-2
                                rounded-xl
                                border border-[rgba(212,175,55,0.34)]
                                bg-[linear-gradient(135deg,rgba(212,175,55,0.22)_0%,rgba(0,0,0,0.18)_40%,rgba(0,0,0,0.22)_100%)]
                                p-4
                                shadow-[0_0_22px_rgba(212,175,55,0.14)]
                                text-[15px] md:text-base
                                leading-relaxed
                                text-white/90
                                font-semibold
                                overflow-hidden
                              "
                            >
                              <span
                                className="
                                  absolute left-0 top-0 h-full w-[3px]
                                  bg-[linear-gradient(to_bottom,rgba(212,175,55,0.85),rgba(212,175,55,0.25),rgba(212,175,55,0.70))]
                                  shadow-[0_0_16px_rgba(212,175,55,0.55)]
                                  opacity-90
                                "
                                aria-hidden="true"
                              />
                              <span
                                className="
                                  pointer-events-none absolute inset-0
                                  bg-[radial-gradient(120%_80%_at_0%_20%,rgba(212,175,55,0.22),transparent_55%)]
                                  opacity-70
                                "
                                aria-hidden="true"
                              />
                              <div className="relative pl-2">{it.a}</div>
                            </div>
                          </Collapsible>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ))
        )}

        {/* ✅ Bottom CTA */}
        <div
          className="
            mt-12
            relative overflow-hidden
            rounded-2xl border border-[rgba(212,175,55,0.45)]
            p-6 md:p-7
            bg-[linear-gradient(135deg,rgba(212,175,55,0.18)_0%,rgba(25,25,25,0.42)_100%)]
            backdrop-blur-md
            shadow-[0_0_25px_rgba(212,175,55,0.16)]
          "
        >
          <div className="text-xl md:text-2xl font-extrabold text-white">
            Still have questions?
          </div>
          <p className="mt-2 text-[15px] md:text-base text-white/75 leading-relaxed">
            We’re happy to help with order questions, product details, and COA interpretation.
            For the fastest support, include your order number (if applicable).
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href="/contact"
              className="
                inline-flex items-center justify-center
                rounded-xl px-4 py-2.5
                border border-[rgba(212,175,55,0.55)]
                bg-black/25
                text-white/90
                hover:border-[rgba(212,175,55,0.80)]
                hover:shadow-[0_0_0_3px_rgba(212,175,55,0.14)]
                transition
              "
            >
              Contact Support
            </Link>

            <Link
              href="/coa"
              className="
                inline-flex items-center justify-center
                rounded-xl px-4 py-2.5
                border border-[rgba(212,175,55,0.35)]
                bg-black/15
                text-white/75
                hover:text-white
                hover:border-[rgba(212,175,55,0.55)]
                transition
              "
            >
              View COAs
            </Link>
          </div>

          <div
            className="
              pointer-events-none absolute inset-0
              bg-[radial-gradient(120%_80%_at_10%_10%,rgba(212,175,55,0.18),transparent_60%)]
              opacity-70
            "
          />
        </div>
      </div>
    </div>
  );
}
