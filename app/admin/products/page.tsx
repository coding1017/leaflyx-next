// app/admin/products/page.tsx
"use client";

import { useMemo, useState } from "react";

const CATEGORIES = [
  "Flower",
  "Smalls",
  "Edibles",
  "Vapes",
  "Beverages",
  "Pre-rolls",
  "Concentrates",
  "Merch",
  "Misc",
] as const;

type VariantDraft = {
  id: string; // "3.5g"
  label: string; // "3.5 g"
  grams?: number;
  price?: number;
  isPopular?: boolean;
  initialQty?: number;
};

export default function AdminProductsPage() {
  const [token, setToken] = useState(() => localStorage.getItem("leaflyx_admin_token") || "");
  const [saved, setSaved] = useState(!!token);

  // product fields
  const [id, setId] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Flower");
  const [subcategories, setSubcategories] = useState(""); // csv or json
  const [tags, setTags] = useState(""); // csv or json
  const [price, setPrice] = useState<string>(""); // optional base price
  const [potency, setPotency] = useState("");
  const [badge, setBadge] = useState("");
  const [coaUrl, setCoaUrl] = useState("");
  const [active, setActive] = useState(true);

  // images
  const [image, setImage] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);

  // variants
  const [variants, setVariants] = useState<VariantDraft[]>([
    { id: "1g", label: "1 g", grams: 1, initialQty: 0 },
    { id: "3.5g", label: "3.5 g", grams: 3.5, isPopular: true, initialQty: 0 },
    { id: "7g", label: "7 g", grams: 7, initialQty: 0 },
  ]);

  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  function saveToken() {
    localStorage.setItem("leaflyx_admin_token", token);
    setSaved(true);
  }

  const variantsJson = useMemo(() => {
    const cleaned = variants
      .map((v) => ({
        id: String(v.id || "").trim(),
        label: String(v.label || "").trim(),
        grams: v.grams ?? null,
        price: v.price ?? null,
        isPopular: !!v.isPopular,
        initialQty: v.initialQty ?? 0,
      }))
      .filter((v) => v.id.length > 0);

    return JSON.stringify(cleaned, null, 2);
  }, [variants]);

  async function submit() {
    setStatus("saving");
    setMsg("");

    try {
      if (!token) throw new Error("Missing admin token");

      const fd = new FormData();
      fd.set("id", id.trim());
      fd.set("slug", slug.trim());
      fd.set("name", name.trim());
      fd.set("category", category);
      fd.set("subcategories", subcategories.trim());
      fd.set("tags", tags.trim());
      fd.set("price", price.trim());
      fd.set("potency", potency.trim());
      fd.set("badge", badge.trim());
      fd.set("coaUrl", coaUrl.trim());
      fd.set("active", active ? "true" : "false");

      if (image) fd.set("image", image);
      for (const f of images) fd.append("images", f);

      fd.set("variantsJson", variantsJson);

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "x-admin-token": token },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setStatus("ok");
      setMsg(`Created product: ${data.created?.name ?? "OK"}`);

      // optional: reset small stuff
      // setId(""); setSlug(""); setName("");
    } catch (e: any) {
      setStatus("err");
      setMsg(e?.message ?? "Failed");
    }
  }

  function updateVariant(i: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  function removeVariant(i: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { id: "", label: "", grams: undefined, price: undefined, isPopular: false, initialQty: 0 },
    ]);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Admin Products</h1>
      <p className="text-sm opacity-80 mt-1">
        Add DB-backed products (uploads images to Vercel Blob) — no need to edit lib/products.ts
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-xs opacity-70">Admin Token</label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste ADMIN_TOKEN"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={saveToken}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Save token
          </button>
          {saved ? <div className="text-xs opacity-70">Saved</div> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
          <div className="text-sm font-semibold">Basics</div>

          <Field label="ID (ex: fl-01)" value={id} onChange={setId} placeholder="fl-01" />
          <Field
            label="Slug (ex: indoor-thca-flower-ice-cream-cake)"
            value={slug}
            onChange={setSlug}
            placeholder="indoor-thca-flower-ice-cream-cake"
          />
          <Field label="Name" value={name} onChange={setName} placeholder="Indoor Flower — Ice Cream Cake" />

          <label className="block">
            <div className="mb-1 text-xs opacity-70">Category</div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <Field label="Subcategories (csv or JSON array)" value={subcategories} onChange={setSubcategories} placeholder='indoor, top-shelf   OR   ["indoor"]' />
          <Field label="Tags (csv or JSON array)" value={tags} onChange={setTags} placeholder='flower, indoor   OR   ["flower","indoor"]' />

          <Field label="Base price (optional)" value={price} onChange={setPrice} placeholder="35" />
          <Field label="Potency (optional)" value={potency} onChange={setPotency} placeholder="26% THCA" />
          <Field label="Badge (optional)" value={badge} onChange={setBadge} placeholder="Bestseller" />
          <Field label="COA URL (optional)" value={coaUrl} onChange={setCoaUrl} placeholder="/coas/ice-cream-cake.pdf" />

          <label className="flex items-center gap-2 text-sm opacity-80">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
          <div className="text-sm font-semibold">Images</div>

          <label className="block">
            <div className="mb-1 text-xs opacity-70">Thumbnail image</div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            <div className="text-xs opacity-60 mt-1">Uploads to Blob and stores URL in DB (production-safe).</div>
          </label>

          <label className="block">
            <div className="mb-1 text-xs opacity-70">Gallery images (optional)</div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files ?? []))}
              className="block w-full text-sm"
            />
          </label>

          <div className="text-sm font-semibold mt-4">Variants</div>

          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <Field label="Variant ID (ex: 3.5g)" value={v.id} onChange={(x) => updateVariant(i, { id: x })} placeholder="3.5g" />
                  <Field label="Label (ex: 3.5 g)" value={v.label} onChange={(x) => updateVariant(i, { label: x })} placeholder="3.5 g" />
                  <Field label="Grams (optional)" value={String(v.grams ?? "")} onChange={(x) => updateVariant(i, { grams: x ? Number(x) : undefined })} placeholder="3.5" />
                  <Field label="Price (optional)" value={String(v.price ?? "")} onChange={(x) => updateVariant(i, { price: x ? Number(x) : undefined })} placeholder="35" />
                  <Field label="Initial Qty" value={String(v.initialQty ?? 0)} onChange={(x) => updateVariant(i, { initialQty: Number(x || 0) })} placeholder="0" />

                  <label className="flex items-center gap-2 text-sm opacity-80 mt-6">
                    <input
                      type="checkbox"
                      checked={!!v.isPopular}
                      onChange={(e) => updateVariant(i, { isPopular: e.target.checked })}
                    />
                    Popular
                  </label>
                </div>

                <button
                  onClick={() => removeVariant(i)}
                  className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-200 hover:bg-red-500/25"
                >
                  Remove variant
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addVariant}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
          >
            Add variant row
          </button>

          <div className="mt-3">
            <div className="text-xs opacity-70 mb-1">variantsJson (what will be sent)</div>
            <pre className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs overflow-x-auto">
              {variantsJson}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          disabled={status === "saving" || !token || !id || !slug || !name || !category}
          onClick={submit}
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
          {status === "saving" ? "Creating..." : "Create product"}
        </button>

        {msg ? (
          <div
            className={`rounded-xl border px-3 py-2 text-sm ${
              status === "ok"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                : status === "err"
                ? "border-red-400/20 bg-red-400/10 text-red-200"
                : "border-white/10 bg-black/30 text-white/80"
            }`}
          >
            {msg}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs opacity-70">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white outline-none"
      />
    </label>
  );
}
