"use client";

import { useMemo, useState } from "react";

type ProductOption = {
  id: string;
  slug: string;
  name: string;
  variants: { id: string; label: string }[];
};

export default function AdminInventoryForm({ products }: { products: ProductOption[] }) {
  const [adminToken, setAdminToken] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [variant, setVariant] = useState<string>(""); // "" => null
  const [qty, setQty] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string>("");

  const selected = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const variantOptions = selected?.variants ?? [];

  async function submit() {
    setStatus("saving");
    setMsg("");

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          productId,
          variant: variant ? variant : null,
          qty,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("err");
        setMsg(data?.error ? String(data.error) : `Request failed (${res.status})`);
        return;
      }

      setStatus("ok");
      setMsg(
        `Saved. prevQty=${data.prevQty} → nextQty=${data.nextQty}. emailed=${data.emailed}`
      );
    } catch (e: any) {
      setStatus("err");
      setMsg(e?.message ?? "Network error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <div className="mb-1 text-xs text-white/70">Admin token</div>
          <input
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="Paste ADMIN_TOKEN from .env"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white outline-none focus:border-[var(--brand-gold)]"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-xs text-white/70">Qty</div>
          <input
            type="number"
            min={0}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white outline-none focus:border-[var(--brand-gold)]"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <div className="mb-1 text-xs text-white/70">Product</div>
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setVariant("");
            }}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white outline-none focus:border-[var(--brand-gold)]"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="mb-1 text-xs text-white/70">Variant</div>
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white outline-none focus:border-[var(--brand-gold)]"
          >
            <option value="">Any size (null)</option>
            {variantOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} ({v.id})
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!adminToken || !productId || qty < 0 || status === "saving"}
        className="
          h-11 rounded-xl px-5 font-semibold text-black
          bg-[var(--brand-gold)]
          shadow-[0_0_28px_rgba(212,175,55,0.55)]
          transition-transform duration-150 ease-out
          hover:brightness-110 hover:shadow-[0_0_36px_rgba(212,175,55,0.70)]
          hover:-translate-y-[1px]
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      >
        {status === "saving" ? "Saving..." : "Update inventory"}
      </button>

      {msg ? (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            status === "ok"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/20 bg-red-400/10 text-red-200"
          }`}
        >
          {msg}
        </div>
      ) : null}
    </div>
  );
}
