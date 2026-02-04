"use client";

import { useEffect, useMemo, useState } from "react";

type VariantOption = {
  id: string; // "1g", "3.5g", etc
  label: string; // "1 g", "3.5 g"
  soldOut?: boolean;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function BackInStockForm({
  productId,
  selectedLabel,
  variants = [],
}: {
  productId: string;
  selectedLabel?: string | null;
  variants?: VariantOption[];
}) {
  const hasVariants = variants.length > 0;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  // 🔒 VARIANT PRODUCTS: force variant-only mode
  const choice: "variant" | "any" = hasVariants ? "variant" : "any";

  const [pickedVariantId, setPickedVariantId] = useState<string>("");

  // Default picked variant = selected variant IF it is sold out
  useEffect(() => {
    if (!hasVariants) return;
    if (pickedVariantId) return;

    const match = variants.find((v) => v.id === selectedLabel && v.soldOut);
    if (match) setPickedVariantId(match.id);
  }, [hasVariants, variants, selectedLabel, pickedVariantId]);

  const pickedLabel = useMemo(() => {
    if (!hasVariants) return null;
    return variants.find((v) => v.id === pickedVariantId)?.label ?? null;
  }, [hasVariants, variants, pickedVariantId]);

  // Variant stored in DB
  const variantToStore = useMemo(() => {
    if (!hasVariants) return null;
    return pickedVariantId || null;
  }, [hasVariants, pickedVariantId]);

  const canSubmit = useMemo(() => {
    if (status === "loading") return false;
    if (!isValidEmail(email)) return false;

    if (hasVariants) {
      const v = variants.find((x) => x.id === pickedVariantId);
      return !!v?.soldOut; // must be sold out
    }

    return true;
  }, [status, email, hasVariants, pickedVariantId, variants]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setMsg("");

    try {
      const res = await fetch("/api/back-in-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variant: variantToStore,
          email: email.trim().toLowerCase(),
        }),
      });

      if (!res.ok) throw new Error();

      setStatus("success");
      setMsg("You’re on the list — we’ll email you when it’s back.");
      setEmail("");
    } catch {
      setStatus("error");
      setMsg("Couldn’t save that email. Please try again.");
    } finally {
      setTimeout(() => setStatus("idle"), 600);
    }
  }

  const headline =
    hasVariants && pickedLabel
      ? `Notify me when ${pickedLabel} is back in stock`
      : "Notify me when this item is back in stock";

  return (
    <div className="mt-4 w-full max-w-md">
      <div className="restock-pulse rounded-2xl border border-white/10 bg-black/25 backdrop-blur p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm text-white/90">{headline}</div>

          {hasVariants && (
            <span className="rounded-full px-3 py-1 text-xs border border-white/10 bg-white/5 text-white/85">
              {pickedLabel ?? "Pick a size"}
            </span>
          )}
        </div>

        {/* 🔒 VARIANT PICKER (variant products only) */}
        {hasVariants && (
          <div className="mt-3 flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = pickedVariantId === v.id;
              const disabled = !v.soldOut;

              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setPickedVariantId(v.id)}
                  className={[
                    "rounded-xl px-3 py-2 border transition text-left min-w-[72px]",
                    active
                      ? "border-[var(--brand-gold)] bg-[rgba(212,175,55,0.12)] text-white shadow-[0_0_22px_rgba(212,175,55,0.28)]"
                      : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10",
                    disabled ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <div className="text-xs font-medium">{v.label}</div>
                  <div className="mt-1 text-[11px] opacity-70">{v.soldOut ? "Sold out" : "In stock"}</div>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email for restock alert"
            className={[
  "h-11 w-full rounded-xl border border-white/10 bg-black/35 px-4",
  // typed text
  "text-[var(--brand-gold)] caret-[var(--brand-gold)]",
  // placeholder glow
  "placeholder-gold-glow",
  // focus polish
  "focus:outline-none focus:ring-2 focus:ring-[rgba(212,175,55,0.25)] focus:border-[rgba(212,175,55,0.40)]",
].join(" ")}

          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-11 rounded-xl px-5 font-semibold bg-[var(--brand-gold)] text-black disabled:opacity-60"
          >
            {status === "loading" ? "Saving..." : "Notify me"}
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between gap-3">
          {msg ? <div className="text-xs text-white/75">{msg}</div> : <div />}
          <div className="text-[11px] text-white/45">Restock alerts only.</div>
        </div>
      </div>
    </div>
  );
}
