// app/admin/products/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  active: boolean;
  updatedAt?: string;
  variants?: Array<{ id: string }>;
};

function fmt(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminProductsPage() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

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
    if (!token) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/products", { headers: { "x-admin-token": token } });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed");
      setRows(data.products || []);
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

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((p) => {
      const hay = `${p.id} ${p.slug} ${p.name} ${p.category}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q]);

  async function del(one: string) {
    if (!token) return;
    if (!confirm(`Delete product "${one}"? This also removes variants + inventory rows.`)) return;

    setMsg("");
    try {
      const res = await fetch(`/api/admin/products?one=${encodeURIComponent(one)}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Delete failed");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--brand-gold)]">Products</h1>
          <p className="text-white/70 mt-1">DB-backed catalog. Edit, delete, and manage variants/images.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/quick-create"
            className="rounded-xl border border-[rgba(245,215,122,0.65)] bg-[#123426] px-4 py-2 text-sm text-white hover:brightness-110 transition"
          >
            Quick Create (legacy)
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-xl bg-[var(--brand-gold)] px-4 py-2 text-sm font-semibold text-black shadow-[0_0_28px_rgba(212,175,55,0.55)] hover:brightness-110 hover:shadow-[0_0_36px_rgba(212,175,55,0.70)] transition"
          >
            + New product
          </Link>
        </div>
      </div>

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

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search id / slug / name / category…"
            className="h-11 w-full md:w-[520px] rounded-xl border border-[rgba(245,215,122,0.65)] bg-[#0B1A14] px-3 text-white outline-none placeholder:text-white/35"
          />
          <div className="text-sm text-white/70">{loading ? "Loading…" : `${filtered.length} products`}</div>
        </div>

        {msg ? (
          <div className="mt-3 rounded-xl border border-red-300/25 bg-[#3A1012] px-3 py-2 text-sm text-red-100">
            {msg}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-white/10 bg-[#0B1A14] p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <div className="text-lg font-semibold text-white truncate">{p.name}</div>
              <div className="text-sm text-white/60 mt-1">
                <span className="text-white/80">{p.slug}</span> • {p.category} •{" "}
                {p.active ? <span className="text-emerald-200">Active</span> : <span className="text-red-200">Inactive</span>}
                {" • "}
                {Array.isArray(p.variants) ? `${p.variants.length} variants` : "—"}
                {p.updatedAt ? ` • Updated ${fmt(p.updatedAt)}` : ""}
              </div>
              <div className="text-xs text-white/50 mt-1">ID: {p.id}</div>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <Link
                href={`/admin/products/edit/${encodeURIComponent(p.slug || p.id)}`}
                className="rounded-xl border border-[rgba(245,215,122,0.65)] bg-[#123426] px-4 py-2 text-sm text-white hover:brightness-110 transition"
              >
                Edit
              </Link>
              <button
                onClick={() => del(p.slug || p.id)}
                className="rounded-xl border border-red-300/25 bg-[#3A1012] px-4 py-2 text-sm text-red-100 hover:brightness-110 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0B1A14] p-6 text-white/70">
            No products found.
          </div>
        ) : null}
      </div>
    </div>
  );
}
