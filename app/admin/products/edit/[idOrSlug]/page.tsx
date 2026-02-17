// app/admin/products/edit/[idOrSlug]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type VariantDraft = {
  id: string;
  label?: string | null;
  grams?: number | null;
  price?: number | null;
  isPopular?: boolean;
};

function safeParseArray(input: string): any[] {
  try {
    const v = JSON.parse(input);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default function AdminProductEditPage() {
  const params = useParams<{ idOrSlug: string }>();
  const idOrSlug = String(params?.idOrSlug || "").trim();
  const router = useRouter();

  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [lockedId, setLockedId] = useState<string>("");

  // fields
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategories, setSubcategories] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("");
  const [potency, setPotency] = useState("");
  const [badge, setBadge] = useState("");
  const [coaUrl, setCoaUrl] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  // images
  const [thumbUrl, setThumbUrl] = useState<string>("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  // variants
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const variantsJson = useMemo(() => JSON.stringify(variants, null, 2), [variants]);
  const [variantsText, setVariantsText] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("leaflyx_admin_token") || "";
    if (t) {
      setToken(t);
      setSaved(true);
    }
  }, []);

  function saveToken() {
    localStorage.setItem("leaflyx_admin_token", token);
    setSaved(true);
  }

  async function load() {
    if (!token || !idOrSlug) return;
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`/api/admin/products?one=${encodeURIComponent(idOrSlug)}`, {
        headers: { "x-admin-token": token },
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load");

      const p = data.product;
      setLockedId(String(p.id || ""));
      setSlug(String(p.slug || ""));
      setName(String(p.name || ""));
      setCategory(String(p.category || ""));
      setSubcategories(typeof p.subcategories === "string" ? p.subcategories : JSON.stringify(p.subcategories ?? []));
      setTags(typeof p.tags === "string" ? p.tags : JSON.stringify(p.tags ?? []));
      setPrice(p.price != null ? String(p.price) : "");
      setPotency(p.potency ? String(p.potency) : "");
      setBadge(p.badge ? String(p.badge) : "");
      setCoaUrl(p.coaUrl ? String(p.coaUrl) : "");
      setDescription(p.description ? String(p.description) : "");
      setActive(!!p.active);

      setThumbUrl(p.imageUrl ? String(p.imageUrl) : "");
      setGalleryUrls(Array.isArray(p.imageUrls) ? p.imageUrls.map(String) : []);

      const v = Array.isArray(p.variants)
        ? p.variants.map((x: any) => ({
            id: String(x.id || "").trim(),
            label: x.label ?? null,
            grams: x.grams ?? null,
            price: x.price ?? null,
            isPopular: !!x.isPopular,
          }))
        : [];
      setVariants(v);
      setVariantsText(JSON.stringify(v, null, 2));
    } catch (e: any) {
      setMsg(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (saved && token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  function syncVariantsFromText() {
    const arr = safeParseArray(variantsText)
      .map((v) => ({
        id: String(v?.id || "").trim(),
        label: v?.label != null ? String(v.label) : null,
        grams: v?.grams != null ? Number(v.grams) : null,
        price: v?.price != null ? Number(v.price) : null,
        isPopular: !!v?.isPopular,
      }))
      .filter((v) => v.id.length > 0);

    setVariants(arr);
    setMsg("✅ Variants synced from JSON.");
    setTimeout(() => setMsg(""), 1200);
  }

  async function save() {
    if (!token) return;
    setSaving(true);
    setMsg("");

    try {
      const fd = new FormData();
      fd.set("one", idOrSlug);

      // ID is intentionally locked for safety (FKs: inventory, variants).
      fd.set("slug", slug.trim().toLowerCase());
      fd.set("name", name.trim());
      fd.set("category", category.trim().toLowerCase());
      fd.set("subcategories", subcategories.trim());
      fd.set("tags", tags.trim());
      fd.set("price", price.trim());
      fd.set("potency", potency.trim());
      fd.set("badge", badge.trim());
      fd.set("coaUrl", coaUrl.trim());
      fd.set("description", description.trim());
      fd.set("active", active ? "true" : "false");

      // variants
      fd.set("variantsJson", JSON.stringify(variants, null, 2));

      // images
      if (thumbFile) fd.set("image", thumbFile);
      for (const f of galleryFiles) fd.append("images", f);

      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "x-admin-token": token },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Save failed");

      setMsg("✅ Saved.");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!token) return;
    if (!confirm("Delete this product? This also deletes variants + inventory rows.")) return;

    setSaving(true);
    setMsg("");

    try {
      const res = await fetch(`/api/admin/products?one=${encodeURIComponent(idOrSlug)}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Delete failed");
      router.push("/admin/products");
    } catch (e: any) {
      setMsg(e?.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--brand-gold)]">Edit product</h1>
          <p className="text-white/70 mt-1">
            ID is locked after creation for safety. You can change everything else (slug/name/category/COA/images/variants).
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:pt-1">
          <Link
            href="/admin/products"
            className="rounded-xl border border-white/10 bg-[#0B1A14] px-4 py-2 text-sm text-white hover:brightness-110 transition"
          >
            Back to products
          </Link>
          <button
            onClick={del}
            className="rounded-xl border border-red-300/25 bg-[#3A1012] px-4 py-2 text-sm text-red-100 hover:brightness-110 transition"
            disabled={saving}
          >
            Delete
          </button>
          <button
            onClick={save}
            className="rounded-xl bg-[var(--brand-gold)] px-4 py-2 text-sm font-semibold text-black shadow-[0_0_28px_rgba(212,175,55,0.55)] hover:brightness-110 hover:shadow-[0_0_36px_rgba(212,175,55,0.70)] transition disabled:opacity-60"
            disabled={saving || !slug || !name || !category}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* token */}
      <div className="rounded-3xl border border-[rgba(245,215,122,0.55)] bg-[#0E231B] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <div className="text-xs text-white/70">Admin Token</div>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste ADMIN_TOKEN"
              className="mt-1 h-11 w-full rounded-xl border border-[rgba(245,215,122,0.65)] bg-[#0B1A14] px-3 text-white outline-none placeholder:text-white/35"
            />
          </div>
          <button
            onClick={saveToken}
            className="h-11 rounded-xl border border-[rgba(245,215,122,0.65)] bg-[#123426] px-4 text-sm text-white hover:brightness-110 transition"
          >
            Save token
          </button>
          <button
            onClick={load}
            className="h-11 rounded-xl bg-[var(--brand-gold)] px-4 text-sm font-semibold text-black hover:brightness-110 transition"
          >
            Refresh
          </button>
        </div>

        {msg ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-[#0B1A14] px-3 py-2 text-sm text-white/80">
            {msg}
          </div>
        ) : null}

        {loading ? <div className="mt-3 text-sm text-white/60">Loading…</div> : null}
      </div>

      {/* form */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#0B1A14] p-5 space-y-3">
          <div className="text-sm font-semibold text-white">Basics</div>

          <Field label="ID (locked)" value={lockedId} onChange={() => {}} disabled />
          <Field label="Slug" value={slug} onChange={setSlug} placeholder="indoor-thca-flower-ice-cream-cake" />
          <Field label="Name" value={name} onChange={setName} placeholder="Indoor Flower — Ice Cream Cake" />
          <Field label="Category (slug)" value={category} onChange={setCategory} placeholder="flower" />

          <Field label="Subcategories (csv or JSON string)" value={subcategories} onChange={setSubcategories} placeholder='["indoor","top-shelf"]' />
          <Field label="Tags (csv or JSON string)" value={tags} onChange={setTags} placeholder='["flower","indoor"]' />

          <Field label="Base price" value={price} onChange={setPrice} placeholder="35" />
          <Field label="Potency" value={potency} onChange={setPotency} placeholder="26% THCA" />
          <Field label="Badge" value={badge} onChange={setBadge} placeholder="Bestseller" />
          <Field label="COA URL" value={coaUrl} onChange={setCoaUrl} placeholder="/coas/ice-cream-cake.pdf" />

          <label className="flex items-center gap-2 text-sm text-white/80 pt-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>

          <label className="block">
            <div className="mb-1 text-xs text-white/70">Description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[110px] w-full rounded-xl border border-white/10 bg-[#0B1A14] px-3 py-2 text-white outline-none"
              placeholder="Optional product description…"
            />
          </label>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0B1A14] p-5 space-y-4">
          <div className="text-sm font-semibold text-white">Images</div>

          {thumbUrl ? (
            <div className="text-xs text-white/70">
              Current thumbnail:{" "}
              <a className="text-[var(--brand-gold)] underline" href={thumbUrl} target="_blank" rel="noreferrer">
                open
              </a>
            </div>
          ) : (
            <div className="text-xs text-white/50">No thumbnail yet.</div>
          )}

          <label className="block">
            <div className="mb-1 text-xs text-white/70">Replace thumbnail (uploads to Blob)</div>
            <input type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-white/70" />
          </label>

          <div className="text-xs text-white/70">Gallery ({galleryUrls.length})</div>
          <div className="flex flex-wrap gap-2">
            {galleryUrls.slice(0, 6).map((u) => (
              <a key={u} href={u} target="_blank" rel="noreferrer" className="text-xs text-[var(--brand-gold)] underline">
                image
              </a>
            ))}
            {galleryUrls.length > 6 ? <div className="text-xs text-white/50">+{galleryUrls.length - 6} more</div> : null}
          </div>

          <label className="block">
            <div className="mb-1 text-xs text-white/70">Add gallery images (uploads to Blob)</div>
            <input type="file" accept="image/*" multiple onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))} className="block w-full text-sm text-white/70" />
          </label>

          <div className="pt-2 border-t border-white/10">
            <div className="text-sm font-semibold text-white">Variants</div>
            <div className="text-xs text-white/60 mt-1">
              Edit JSON, then click <span className="text-white/80">Sync variants from JSON</span>.
            </div>

            <textarea
              value={variantsText}
              onChange={(e) => setVariantsText(e.target.value)}
              className="mt-2 min-h-[240px] w-full rounded-xl border border-white/10 bg-[#0B1A14] px-3 py-2 text-xs text-white outline-none"
            />

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={syncVariantsFromText}
                className="rounded-xl border border-[rgba(245,215,122,0.65)] bg-[#123426] px-3 py-2 text-xs text-white hover:brightness-110 transition"
              >
                Sync variants from JSON
              </button>

              <button
                onClick={() => {
                  setVariantsText(variantsJson);
                  setMsg("✅ Reset editor to current variants state.");
                  setTimeout(() => setMsg(""), 1200);
                }}
                className="rounded-xl border border-white/10 bg-[#0B1A14] px-3 py-2 text-xs text-white hover:brightness-110 transition"
              >
                Reset JSON to current
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B1A14] p-4 text-xs text-white/60">
        <div className="text-white/80 font-semibold mb-1">Note on changing product IDs</div>
        IDs are referenced by inventory and other tables. If you truly need “change ID”, we can implement a safe “clone + migrate inventory + delete old”
        workflow (Shopify-style), but it’s risky to do as a simple edit.
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-white/70">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`h-11 w-full rounded-xl border px-3 text-white outline-none placeholder:text-white/35 ${
          disabled ? "border-white/10 bg-[#0B1A14] opacity-70" : "border-white/10 bg-[#0B1A14]"
        }`}
      />
    </label>
  );
}
