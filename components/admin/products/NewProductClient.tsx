// components/admin/products/NewProductClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Upload, Plus, Trash2, Image as ImageIcon } from "lucide-react";

type VariantDraft = {
  id: string;
  label?: string;
  grams?: string;
  price?: string;
  isPopular?: boolean;
  initialQty?: string;
};

const DEFAULT_VARIANTS: VariantDraft[] = [
  { id: "1g", grams: "1", isPopular: false, initialQty: "0" },
  { id: "3.5g", grams: "3.5", isPopular: true, initialQty: "0" },
];

const TOKEN_KEY = "leaflyx_admin_token";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanNumOrEmpty(v: string) {
  const s = (v ?? "").trim();
  if (!s) return "";
  const n = Number(s);
  return Number.isFinite(n) ? s : "";
}

function toCsvOrJsonInput(v: string) {
  return (v ?? "").trim();
}

function bytesLabel(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

function useObjectUrls(files: File[]) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    if (!files?.length) {
      setUrls([]);
      return;
    }
    const list = files.map((f) => URL.createObjectURL(f));
    setUrls(list);
    return () => list.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  return urls;
}

export default function NewProductClient() {
  const router = useRouter();

  const [adminToken, setAdminToken] = useState("");
  useEffect(() => {
    setAdminToken(localStorage.getItem(TOKEN_KEY) || "");
  }, []);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const autoSlug = useMemo(() => slugify(name), [name]);
  const [slug, setSlug] = useState("");
  const slugValue = slug.trim().length ? slug.trim() : autoSlug;

  const [category, setCategory] = useState("flower");
  const [active, setActive] = useState(true);

  const [price, setPrice] = useState("");
  const [potency, setPotency] = useState("");
  const [badge, setBadge] = useState("");
  const [coaUrl, setCoaUrl] = useState("");

  const [tags, setTags] = useState("");
  const [subcategories, setSubcategories] = useState("");

  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const heroPreview = useObjectUrl(heroFile);
  const galleryPreviews = useObjectUrls(galleryFiles);

  const [variants, setVariants] = useState<VariantDraft[]>(DEFAULT_VARIANTS);

  function addVariant() {
    setVariants((prev) => [...prev, { id: "", grams: "", price: "", isPopular: false, initialQty: "0" }]);
  }

  function removeVariant(idx: number) {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateVariant(idx: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }

  function validate() {
    if (!adminToken) return "Missing admin token. Paste it in the Admin Token card and click Save token.";
    if (!name.trim()) return "Product name is required.";
    if (!slugValue.trim()) return "Slug is required.";
    if (!category.trim()) return "Category is required.";

    const ids = variants.map((v) => v.id.trim()).filter(Boolean);
    if (ids.length === 0) return "Add at least 1 variant (ex: 3.5g).";

    const set = new Set<string>();
    for (const id of ids) {
      if (set.has(id)) return `Duplicate variant id: ${id}`;
      set.add(id);
    }
    return null;
  }

  async function submit(createAsActive: boolean) {
    setErr(null);
    setOkMsg(null);

    const vErr = validate();
    if (vErr) {
      setErr(vErr);
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();

      fd.set("slug", slugValue);
      fd.set("name", name.trim());
      fd.set("category", category.trim());

      fd.set("price", cleanNumOrEmpty(price));
      fd.set("potency", potency.trim());
      fd.set("badge", badge.trim());
      fd.set("coaUrl", coaUrl.trim());

      fd.set("tags", toCsvOrJsonInput(tags));
      fd.set("subcategories", toCsvOrJsonInput(subcategories));
      fd.set("active", createAsActive ? "true" : "false");

      if (heroFile) fd.set("image", heroFile);
      for (const f of galleryFiles) fd.append("images", f);

      const variantsJson = variants
        .map((v) => ({
          id: v.id.trim(),
          label: (v.label ?? "").trim() || null,
          grams: v.grams ? Number(v.grams) : null,
          price: v.price ? Number(v.price) : null,
          isPopular: !!v.isPopular,
          initialQty: v.initialQty ? Number(v.initialQty) : 0,
        }))
        .filter((v) => v.id.length > 0);

      fd.set("variantsJson", JSON.stringify(variantsJson));

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "x-admin-token": adminToken },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to create product");

      setOkMsg(createAsActive ? "Product created." : "Draft saved.");
      router.push("/admin/products");
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl py-10 text-white">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-[var(--brand-gold)]">Add New Product</h1>
          <p className="mt-1 text-sm text-white/60">Shopify-style editor (Leaflyx fields + variants + inventory rows).</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={saving}
            onClick={() => submit(false)}
            className="rounded-2xl border border-white/15 bg-black/35 px-5 py-3 text-sm font-semibold text-white/80 hover:text-white disabled:opacity-60"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => submit(true)}
            className="rounded-2xl bg-[var(--brand-gold)] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.55)] transition hover:scale-[1.02] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add Product"}
          </button>
        </div>
      </div>

      {err ? (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{err}</div>
      ) : null}

      {okMsg ? (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
          <CheckCircle2 className="h-4 w-4" />
          {okMsg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="General Information">
            <div className="space-y-4">
              <Field label="Product name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Emerald OG — Indoor Flower" className={inputClass} />
              </Field>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Slug">
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={autoSlug || "auto-generated"} className={inputClass} />
                  <div className="mt-1 text-[11px] text-white/50">
                    Final: <span className="text-white/70">/shop/{slugValue || "..."}</span>
                  </div>
                </Field>

                <Field label="COA URL (optional)">
                  <input value={coaUrl} onChange={(e) => setCoaUrl(e.target.value)} placeholder="https://..." className={inputClass} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Category">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                    <option value="flower">Flower</option>
                    <option value="smalls">Smalls</option>
                    <option value="edibles">Edibles</option>
                    <option value="vapes">Vapes</option>
                    <option value="beverages">Beverages</option>
                    <option value="pre-rolls">Pre-rolls</option>
                    <option value="concentrates">Concentrates</option>
                  </select>
                </Field>

                <Field label="Potency (optional)">
                  <input value={potency} onChange={(e) => setPotency(e.target.value)} placeholder="Ex: 27.2% THCA" className={inputClass} />
                </Field>

                <Field label="Badge (optional)">
                  <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder='Ex: "Top Shelf"' className={inputClass} />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="Pricing & Stock">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Base price (optional)">
                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex: 34.99" inputMode="decimal" className={inputClass} />
                <div className="mt-1 text-[11px] text-white/50">Tip: you can override pricing per variant below.</div>
              </Field>

              <div className="rounded-2xl border border-[rgba(245,215,122,0.55)] bg-[#123426] p-4">
                <div className="text-sm font-semibold text-white/80">Inventory</div>
                <div className="mt-1 text-xs text-white/55">Initial qty is set per variant (auto creates inventory rows).</div>
              </div>
            </div>
          </Card>

          <Card title="Variants">
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div key={`${idx}-${v.id}`} className="rounded-3xl border border-white/10 bg-black/25 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                    <div className="md:col-span-3">
                      <Field label="Variant id (required)">
                        <input value={v.id} onChange={(e) => updateVariant(idx, { id: e.target.value })} placeholder="3.5g" className={inputClass} />
                      </Field>
                    </div>

                    <div className="md:col-span-3">
                      <Field label="Label">
                        <input value={v.label ?? ""} onChange={(e) => updateVariant(idx, { label: e.target.value })} placeholder="Eighth" className={inputClass} />
                      </Field>
                    </div>

                    <div className="md:col-span-2">
                      <Field label="Grams">
                        <input value={v.grams ?? ""} onChange={(e) => updateVariant(idx, { grams: e.target.value })} placeholder="3.5" inputMode="decimal" className={inputClass} />
                      </Field>
                    </div>

                    <div className="md:col-span-2">
                      <Field label="Price override">
                        <input value={v.price ?? ""} onChange={(e) => updateVariant(idx, { price: e.target.value })} placeholder="34.99" inputMode="decimal" className={inputClass} />
                      </Field>
                    </div>

                    <div className="md:col-span-2">
                      <Field label="Initial qty">
                        <input value={v.initialQty ?? ""} onChange={(e) => updateVariant(idx, { initialQty: e.target.value })} placeholder="0" inputMode="numeric" className={inputClass} />
                      </Field>
                    </div>

                    <div className="md:col-span-12 mt-2 flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-white/70">
                        <input type="checkbox" checked={!!v.isPopular} onChange={(e) => updateVariant(idx, { isPopular: e.target.checked })} className="h-4 w-4 accent-[var(--brand-gold)]" />
                        Popular
                      </label>

                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-2 text-sm text-white/70 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addVariant} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white/80 hover:text-white">
                <Plus className="h-4 w-4" />
                Add variant
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Upload Img">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-3">
                <div className="text-xs text-white/60">Hero image</div>

                <div className="mt-3 aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/35">
                  {heroPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroPreview} alt="Hero preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/40">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-white/75">
                    <Upload className="h-4 w-4" />
                    {heroFile ? heroFile.name : "Choose hero image"}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)} />
                  <span className="text-xs text-white/60">{heroFile ? bytesLabel(heroFile.size) : ""}</span>
                </label>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/60">Gallery</div>
                  <button type="button" onClick={() => setGalleryFiles([])} className="text-xs text-white/50 hover:text-white">
                    Clear
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {galleryPreviews.slice(0, 8).map((src, i) => (
                    <div key={`${src}-${i}`} className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/35">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                  <label className="aspect-square cursor-pointer rounded-xl border border-dashed border-white/20 bg-black/20 p-2 hover:border-white/35">
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-white/55">
                      <Plus className="h-5 w-5" />
                      <div className="text-[11px]">Add</div>
                    </div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))} />
                  </label>
                </div>

                {galleryFiles.length ? <div className="mt-2 text-[11px] text-white/50">{galleryFiles.length} selected</div> : null}
              </div>
            </div>
          </Card>

          <Card title="Category">
            <Field label="Product category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                <option value="flower">Flower</option>
                <option value="smalls">Smalls</option>
                <option value="edibles">Edibles</option>
                <option value="vapes">Vapes</option>
                <option value="beverages">Beverages</option>
                <option value="pre-rolls">Pre-rolls</option>
                <option value="concentrates">Concentrates</option>
              </select>
            </Field>
          </Card>

          <Card title="Status">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">Active</div>
              <label className="inline-flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[var(--brand-gold)]" />
                {active ? "On" : "Off"}
              </label>
            </div>
            <div className="mt-2 text-[11px] text-white/50">Save Draft button will force this product to inactive.</div>
          </Card>

          <Card title="Tags">
            <Field label="Tags (CSV or JSON array)">
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="indoor, top-shelf, relaxing" className={inputClass} />
            </Field>
            <div className="mt-4" />
            <Field label="Subcategories (CSV or JSON array)">
              <input value={subcategories} onChange={(e) => setSubcategories(e.target.value)} placeholder="indica, hybrid" className={inputClass} />
            </Field>
          </Card>

          <Card title="Admin Token">
            <div className="text-[11px] text-white/50">
              Uses localStorage key <code className="text-white/70">{TOKEN_KEY}</code>.
            </div>

            <input value={adminToken} onChange={(e) => setAdminToken(e.target.value)} placeholder="Paste admin token" className={`${inputClass} mt-3`} />

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(TOKEN_KEY, adminToken);
                  setOkMsg("Saved admin token in this browser.");
                  setErr(null);
                }}
                className="flex-1 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white/80 hover:text-white"
              >
                Save token
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(TOKEN_KEY);
                  setAdminToken("");
                  setOkMsg("Cleared admin token.");
                  setErr(null);
                }}
                className="rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white/70 hover:text-white"
              >
                Clear
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/15 bg-black/35 px-4 py-3 outline-none focus:border-[var(--brand-gold)]/60";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="mb-4 text-sm font-semibold text-white/80">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-white/60">{label}</div>
      {children}
    </div>
  );
}
