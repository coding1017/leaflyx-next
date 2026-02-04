"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { removeCompare } from "@/lib/compare";

const SIZES = ["1g", "3.5g", "7g", "14g", "28g"] as const;

function thcaPct(potency?: string | null) {
  if (!potency) return null;
  const m = String(potency).match(/(\d+(\.\d+)?)\s*%/);
  return m ? Number(m[1]) : null;
}

function imageSrcOf(product: any): string | null {
  const imgs = product?.images;
  if (Array.isArray(imgs) && imgs.length) {
    const first = imgs[0];
    return typeof first === "string" ? first : first?.src ?? null;
  }
  const primary = product?.image;
  if (!primary) return null;
  return typeof primary === "string" ? primary : primary?.src ?? null;
}

function variantPrice(product: any, sizeId: string): number | null {
  const vars = Array.isArray(product?.variants) ? product.variants : [];
  const v = vars.find((x: any) => String(x?.id).toLowerCase() === sizeId.toLowerCase());
  const price = Number(v?.price);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function gramsOf(sizeId: string) {
  const s = sizeId.toLowerCase();
  if (s === "1g") return 1;
  if (s === "3.5g") return 3.5;
  if (s === "7g") return 7;
  if (s === "14g") return 14;
  if (s === "28g") return 28;
  return null;
}

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

// ✅ numeric detection for gradient (ONLY numeric-looking strings)
function isNumericish(v: any) {
  if (v == null) return false;
  if (typeof v !== "string") return false;
  return /\d/.test(v);
}

export default function CompareClient({ initial }: { initial: any[] }) {
  const [selected, setSelected] = useState<any[]>(initial);
  const [copied, setCopied] = useState(false); // ✅ for copy link feedback

  const compareHref = useMemo(() => {
    const slugs = selected.map((p) => encodeURIComponent(p.slug)).join(",");
    return slugs ? `/compare?items=${slugs}` : "/compare";
  }, [selected]);

  function handleRemove(product: any) {
    removeCompare(product.id);

    const next = selected.filter((p) => p.id !== product.id);
    setSelected(next);

    const slugs = next.map((p) => encodeURIComponent(p.slug)).join(",");
    const url = slugs ? `/compare?items=${slugs}` : "/compare";
    window.history.replaceState(null, "", url);

    window.dispatchEvent(new Event("leaflyx-compare"));
  }

  if (!selected.length) {
    return (
      <div className="mt-10 rounded-3xl border border-[var(--brand-gold)] bg-black/25 backdrop-blur p-6">
        <p className="text-white/80">All items removed.</p>
        <div className="mt-4">
          <Link
            href="/products"
            className="btn-gold rounded-xl px-4 py-2 text-sm font-semibold border border-[var(--brand-gold)]"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  // Table columns: 1 feature column + N product columns
  const cols = 1 + selected.length;
  const gridColsClass =
    cols === 3 ? "grid-cols-3" : cols === 4 ? "grid-cols-4" : "grid-cols-2";

  // ✅ Thicker, fully-opaque gold grid lines
  const rowBorder = "border-b border-[var(--brand-gold)]";
  const colBorder = "border-l-[2px] border-[var(--brand-gold)]";

  return (
    <div className="mt-8 overflow-x-auto">
      <div
        className="
          min-w-[1100px]
          rounded-3xl
          border-[3px] border-[var(--brand-gold)]
          bg-black/35 backdrop-blur-xl
          shadow-[0_18px_60px_rgba(0,0,0,0.42),0_0_28px_rgba(212,175,55,0.22)]
          overflow-hidden
        "
      >
        {/* header row */}
        <div className={`grid ${gridColsClass} gap-0 ${rowBorder} bg-black/40`}>
          <div className="p-5 text-sm font-extrabold tracking-wide text-[var(--brand-gold)]">
            Feature
          </div>

          {selected.map((p) => {
            const src = imageSrcOf(p);
            return (
              <div key={p.id} className={`p-5 ${colBorder}`}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[var(--brand-gold)] bg-black/30">
                      {src ? (
                        <Image
                          src={src}
                          alt={p.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <Link
                      href={`/products/${p.slug}`}
                      className="block text-lg font-extrabold text-white hover:text-[var(--brand-gold)] transition truncate"
                      title={p.name}
                    >
                      {p.name}
                    </Link>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {p.badge ? <span className="badge">{p.badge}</span> : null}
                      {p.potency ? <span className="pill">{p.potency}</span> : null}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => handleRemove(p)}
                    className="
                      rounded-xl px-3 py-2 text-xs font-extrabold
                      border border-[var(--brand-gold)]
                      bg-black/40 text-[var(--brand-gold)]
                      hover:bg-black/50
                      hover:shadow-[0_0_14px_rgba(212,175,55,0.18)]
                      transition
                    "
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <Row
          label="THCA %"
          cols={gridColsClass}
          values={selected.map((p) => {
            const n = thcaPct(p.potency);
            return n == null ? "—" : `${n}%`;
          })}
          colBorder={colBorder}
          rowBorder={rowBorder}
        />

        <Row
          label="Strain type"
          cols={gridColsClass}
          values={selected.map((p) => (p as any).type ?? "—")}
          colBorder={colBorder}
          rowBorder={rowBorder}
        />

        {SIZES.map((size) => (
          <Row
            key={size}
            label={`${size} price`}
            cols={gridColsClass}
            values={selected.map((p) => {
              const price = variantPrice(p, size);
              return price == null ? "—" : money(price);
            })}
            colBorder={colBorder}
            rowBorder={rowBorder}
          />
        ))}

        <Row
          label="Best $/g"
          cols={gridColsClass}
          values={selected.map((p) => {
            let best: number | null = null;
            for (const size of SIZES) {
              const grams = gramsOf(size);
              const price = variantPrice(p, size);
              if (!grams || price == null) continue;
              const ppg = price / grams;
              best = best == null ? ppg : Math.min(best, ppg);
            }
            return best == null ? "—" : `${money(best)}/g`;
          })}
          colBorder={colBorder}
          rowBorder={rowBorder}
        />

        <Row
          label="COA"
          cols={gridColsClass}
          values={selected.map((p) => {
            return p.coaUrl ? (
              <a
                key={p.id}
                href={p.coaUrl}
                target="_blank"
                rel="noreferrer"
                className="
                  inline-flex items-center justify-center
                  rounded-xl border border-[var(--brand-gold)]
                  bg-black/40 px-3 py-2 text-xs font-extrabold
                  text-[var(--brand-gold)]
                  hover:bg-black/50
                  hover:shadow-[0_0_14px_rgba(212,175,55,0.18)]
                  transition
                "
              >
                View COA
              </a>
            ) : (
              "—"
            );
          })}
          isNode
          colBorder={colBorder}
          rowBorder={rowBorder}
        />

        {/* Actions row */}
        <div className={`grid ${gridColsClass} gap-0 bg-black/40`}>
          <div className={`p-5 text-sm font-extrabold tracking-wide text-[var(--brand-gold)] ${rowBorder}`}>
            Actions
          </div>

          <div className={`p-5 ${colBorder} col-span-2`}>
            <button
              type="button"
              onClick={async () => {
                try {
                  const url = typeof window !== "undefined" ? window.location.href : compareHref;
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                } catch {
                  // silent fail
                }
              }}
              className="inline-flex btn-gold rounded-xl px-4 py-2 text-sm font-semibold border border-[var(--brand-gold)]"
            >
              {copied ? "Copied ✓" : "Copy compare link"}
            </button>

            <p className="mt-2 text-xs text-white/55">
              Share this link — it preserves the current comparison.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  values,
  cols,
  isNode,
  colBorder,
  rowBorder,
}: {
  label: string;
  values: any[];
  cols: string;
  isNode?: boolean;
  colBorder: string;
  rowBorder: string;
}) {
  return (
    <div className={`grid ${cols} gap-0 ${rowBorder} last:border-b-0 bg-black/40`}>
      <div className="p-5 text-sm font-semibold text-white/75">{label}</div>

      {values.map((v, idx) => {
        const numeric = !isNode && isNumericish(v);

        return (
          <div key={idx} className={`p-5 text-sm text-white/90 font-semibold ${colBorder}`}>
            {isNode ? (
              v
            ) : numeric ? (
              <span className="font-extrabold bg-gradient-to-r from-lime-400 to-yellow-300 bg-clip-text text-transparent">
                {v}
              </span>
            ) : (
              <span>{v}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
