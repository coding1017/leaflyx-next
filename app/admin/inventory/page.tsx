// app/admin/inventory/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = {
  productId: string;
  productName: string;
  slug: string | null;

  variant: string | null;
  variantLabel: string | null;
  qty: number;

  updatedAt: string;
  subscribers: number;

  category?: string | null;
  image?: string | null;
  missingInventory?: boolean;
};

type ApiList = { ok: boolean; rows: Row[]; error?: string };

function canon(s: string) {
  return s.trim().toLowerCase();
}

function fmtWhen(iso: string) {
  try {
    const d = new Date(iso);
    if (!iso || !Number.isFinite(d.getTime()) || d.getTime() <= 0) return "—";
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function keyFor(pid: string, v: string | null) {
  return `${pid}__${v ?? "∅"}`;
}

function variantSortKey(row: Row) {
  const raw = String(row.variant ?? row.variantLabel ?? "").trim().toLowerCase();
  const cleaned = raw.replace(/\(.*?\)/g, "").replace(/\s+/g, "").trim();
  if (!cleaned) return { unitRank: 9, value: Number.POSITIVE_INFINITY, tie: "" };

  const g = cleaned.match(/^(\d+(?:\.\d+)?)g$/);
  if (g) return { unitRank: 0, value: Number(g[1]), tie: cleaned };

  const oz = cleaned.match(/^(\d+(?:\.\d+)?)oz$/);
  if (oz) return { unitRank: 1, value: Number(oz[1]), tie: cleaned };

  const mg = cleaned.match(/^(\d+(?:\.\d+)?)mg$/);
  if (mg) return { unitRank: 2, value: Number(mg[1]), tie: cleaned };

  return { unitRank: 5, value: Number.POSITIVE_INFINITY, tie: cleaned };
}

function groupByProduct(rows: Row[]) {
  const map: Record<
    string,
    {
      productId: string;
      productName: string;
      slug: string | null;
      category?: string | null;
      image?: string | null;
      totalSubscribers: number;
      anyOOS: boolean;
      anyMissing: boolean;
      variants: Row[];
      updatedAtMax: string;
    }
  > = {};

  for (const r of rows) {
    if (!map[r.productId]) {
      map[r.productId] = {
        productId: r.productId,
        productName: r.productName,
        slug: r.slug,
        category: r.category ?? null,
        image: r.image ?? null,
        totalSubscribers: 0,
        anyOOS: false,
        anyMissing: false,
        variants: [],
        updatedAtMax: r.updatedAt,
      };
    }

    const g = map[r.productId];
    g.variants.push(r);
    g.totalSubscribers += r.subscribers;
    g.anyOOS = g.anyOOS || r.qty <= 0;
    g.anyMissing = g.anyMissing || !!r.missingInventory;

    if (!g.image && r.image) g.image = r.image;
    if (!g.category && r.category) g.category = r.category;

    const a = new Date(g.updatedAtMax).getTime();
    const b = new Date(r.updatedAt).getTime();
    if (Number.isFinite(b) && b > a) g.updatedAtMax = r.updatedAt;
  }

  for (const pid of Object.keys(map)) {
    map[pid].variants.sort((a, b) => {
      const ak = variantSortKey(a);
      const bk = variantSortKey(b);
      if (ak.unitRank !== bk.unitRank) return ak.unitRank - bk.unitRank;
      if (ak.value !== bk.value) return ak.value - bk.value;
      return ak.tie.localeCompare(bk.tie);
    });
  }

  const sorted: typeof map = {};
  Object.values(map)
    .sort((a, b) => a.productName.toLowerCase().localeCompare(b.productName.toLowerCase()))
    .forEach((g) => (sorted[g.productId] = g));

  return sorted;
}

export default function AdminInventoryPage() {
  const [token, setToken] = useState("");
  const [tokenSaved, setTokenSaved] = useState(false);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [showOnlySubscribed, setShowOnlySubscribed] = useState(false);
  const [showOnlyOOS, setShowOnlyOOS] = useState(false);
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("leaflyx_admin_token") || "";
    if (t) {
      setToken(t);
      setTokenSaved(true);
    }
  }, []);

  function saveToken() {
    localStorage.setItem("leaflyx_admin_token", token);
    setTokenSaved(true);
  }

  async function fetchList() {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "GET",
        headers: { "x-admin-token": token },
      });

      const data = (await res.json()) as ApiList;
      if (!data.ok) throw new Error(data.error || "Failed to load");

      const nextRows = data.rows || [];
      setRows(nextRows);

      const grouped = groupByProduct(nextRows);
      const nextOpen: Record<string, boolean> = { ...open };
      Object.keys(grouped)
        .slice(0, 5)
        .forEach((pid) => {
          if (nextOpen[pid] === undefined) nextOpen[pid] = true;
        });
      setOpen(nextOpen);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenSaved && token) fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenSaved]);

  async function action(actionName: "setQty" | "resetQty" | "notify", row: Row, qty?: number) {
    if (!token) return;

    const k = keyFor(row.productId, row.variant);
    setBusyKey(k);
    setError(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({
          action: actionName,
          productId: row.productId,
          variant: row.variant,
          ...(actionName === "setQty" ? { qty } : {}),
        }),
      });

      const data = await res.json();
      setLastResult(data);
      if (!data.ok) throw new Error(data.error || "Action failed");
      await fetchList();
    } catch (e: any) {
      setError(e?.message ?? "Action failed");
    } finally {
      setBusyKey(null);
    }
  }

  const filteredRows = useMemo(() => {
    const needle = canon(q);
    return rows
      .filter((r) => {
        if (!needle) return true;
        const hay = `${r.productName} ${r.productId} ${r.slug ?? ""} ${r.variant ?? ""} ${
          r.variantLabel ?? ""
        } ${r.category ?? ""}`.toLowerCase();
        return hay.includes(needle);
      })
      .filter((r) => (showOnlySubscribed ? r.subscribers > 0 : true))
      .filter((r) => (showOnlyOOS ? r.qty <= 0 : true))
      .filter((r) => (showOnlyMissing ? !!r.missingInventory : true));
  }, [rows, q, showOnlySubscribed, showOnlyOOS, showOnlyMissing]);

  const grouped = useMemo(() => groupByProduct(filteredRows), [filteredRows]);

  const productCount = Object.keys(grouped).length;
  const variantCount = filteredRows.length;

  // Leaflyx admin palette (solid-ish)
  const EMERALD_900 = "bg-[#0B1A14]";
  const EMERALD_800 = "bg-[#0E231B]";
  const EMERALD_750 = "bg-[#123426]";
  const GOLD_BORDER = "border-[rgba(245,215,122,0.55)]";
  const GOLD_BORDER_STRONG = "border-[rgba(245,215,122,0.80)]";
  const GOLD_TEXT = "text-[var(--brand-gold)]";
  const MUTED = "text-white/70";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className={`rounded-3xl border ${GOLD_BORDER} ${EMERALD_800} p-6`}>
        {/* ✅ Title row with RIGHT-aligned buttons */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className={`text-2xl font-semibold ${GOLD_TEXT}`}>Admin Inventory</h1>
            <p className={`text-sm ${MUTED} mt-1`}>
              Grouped by product • thumbnails • numeric variant order
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end md:pt-1">
            <Link
              href="/admin/products/quick-create"
              className={`
                rounded-xl border ${GOLD_BORDER_STRONG}
                ${EMERALD_750} px-4 py-2 text-sm text-white
                hover:brightness-110 transition
              `}
            >
              Quick Create (legacy)
            </Link>

            <Link
              href="/admin/products/new"
              className={`
                rounded-xl bg-[var(--brand-gold)] px-4 py-2 text-sm font-semibold text-black
                shadow-[0_0_28px_rgba(212,175,55,0.55)]
                hover:brightness-110 hover:shadow-[0_0_36px_rgba(212,175,55,0.70)]
                transition
              `}
            >
              + New product
            </Link>
          </div>
        </div>

        <div className={`mt-5 rounded-2xl border ${GOLD_BORDER} ${EMERALD_900} p-4`}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-xs text-white/70">Admin Token</label>
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste ADMIN_TOKEN"
                  className={`
                    mt-1 w-full rounded-xl border ${GOLD_BORDER_STRONG}
                    ${EMERALD_900} px-3 py-2 text-sm text-white outline-none
                    placeholder:text-white/40
                  `}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={saveToken}
                  className={`
                    rounded-xl border ${GOLD_BORDER_STRONG}
                    ${EMERALD_750} px-4 py-2 text-sm text-white
                    hover:brightness-110 transition
                  `}
                >
                  Save token
                </button>

                <button
                  onClick={fetchList}
                  className={`
                    rounded-xl bg-[var(--brand-gold)] px-4 py-2 text-sm text-black
                    hover:brightness-110 transition
                  `}
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search product / id / slug / variant…"
                  className={`
                    w-full md:w-[420px] rounded-xl border ${GOLD_BORDER_STRONG}
                    ${EMERALD_900} px-3 py-2 text-sm text-white outline-none
                    placeholder:text-white/40
                  `}
                />

                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={showOnlySubscribed}
                    onChange={(e) => setShowOnlySubscribed(e.target.checked)}
                  />
                  Subscribers only
                </label>

                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input type="checkbox" checked={showOnlyOOS} onChange={(e) => setShowOnlyOOS(e.target.checked)} />
                  Out of stock only
                </label>

                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={showOnlyMissing}
                    onChange={(e) => setShowOnlyMissing(e.target.checked)}
                  />
                  Missing rows only
                </label>

                <button
                  onClick={() => {
                    const next: Record<string, boolean> = {};
                    for (const pid of Object.keys(grouped)) next[pid] = true;
                    setOpen(next);
                  }}
                  className={`
                    rounded-xl border ${GOLD_BORDER_STRONG}
                    ${EMERALD_750} px-3 py-2 text-xs text-white
                    hover:brightness-110 transition
                  `}
                >
                  Expand all
                </button>

                <button
                  onClick={() => {
                    const next: Record<string, boolean> = {};
                    for (const pid of Object.keys(grouped)) next[pid] = false;
                    setOpen(next);
                  }}
                  className={`
                    rounded-xl border ${GOLD_BORDER_STRONG}
                    ${EMERALD_750} px-3 py-2 text-xs text-white
                    hover:brightness-110 transition
                  `}
                >
                  Collapse all
                </button>
              </div>

              {loading ? (
                <div className="text-sm text-white/70">Loading…</div>
              ) : (
                <div className="text-sm text-white/70">
                  {productCount} products • {variantCount} variants
                </div>
              )}
            </div>

            {error ? (
              <div className="mt-2 rounded-xl border border-red-600 bg-[#2A0F12] p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {lastResult ? (
              <div className={`mt-2 rounded-xl border ${GOLD_BORDER} ${EMERALD_900} p-3 text-xs text-white`}>
                <div className="mb-1 font-semibold text-white/90">Last action result</div>
                <pre className="whitespace-pre-wrap break-words text-white/80">{JSON.stringify(lastResult, null, 2)}</pre>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {Object.entries(grouped).map(([pid, group]) => (
          <ProductGroupCard
            key={pid}
            pid={pid}
            group={group}
            isOpen={open[pid] ?? true}
            setOpen={(v) => setOpen((prev) => ({ ...prev, [pid]: v }))}
            busyKey={busyKey}
            onAction={action}
          />
        ))}

        {!Object.keys(grouped).length && !loading ? (
          <div className={`rounded-2xl border ${GOLD_BORDER} ${EMERALD_900} p-6 text-sm text-white/80`}>
            No matching products.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProductGroupCard({
  group,
  isOpen,
  setOpen,
  busyKey,
  onAction,
}: {
  pid: string;
  group: {
    productId: string;
    productName: string;
    slug: string | null;
    category?: string | null;
    image?: string | null;
    totalSubscribers: number;
    anyOOS: boolean;
    anyMissing: boolean;
    variants: Row[];
    updatedAtMax: string;
  };
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  busyKey: string | null;
  onAction: (actionName: "setQty" | "resetQty" | "notify", row: Row, qty?: number) => Promise<void>;
}) {
  const href = group.slug ? `/shop/${group.slug}` : null;

  const EMERALD_850 = "bg-[#0E231B]";
  const EMERALD_900 = "bg-[#0B1A14]";
  const GOLD_BORDER = "border-[rgba(245,215,122,0.55)]";
  const GOLD_BORDER_STRONG = "border-[rgba(245,215,122,0.80)]";
  const GOLD_TEXT = "text-[var(--brand-gold)]";

  return (
    <div className={`rounded-2xl overflow-hidden border ${GOLD_BORDER} ${EMERALD_850}`}>
      <button
        onClick={() => setOpen(!isOpen)}
        className={`w-full text-left px-4 py-4 hover:brightness-110 transition flex items-center justify-between gap-4`}
      >
        <div className="flex items-start gap-3">
          <div className={`relative mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-xl border ${GOLD_BORDER_STRONG} ${EMERALD_900}`}>
            {group.image ? (
              <Image src={group.image} alt={group.productName} fill sizes="48px" className="object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center text-[10px] text-white/60">No image</div>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold text-white truncate">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline decoration-[var(--brand-gold)]"
                >
                  {group.productName}
                </a>
              ) : (
                group.productName
              )}
            </div>

            <div className="mt-1 flex flex-wrap gap-2 items-center">
              {group.category ? (
                <span className={`inline-flex items-center rounded-full border ${GOLD_BORDER_STRONG} bg-[#123426] px-2.5 py-1 text-[11px] text-white`}>
                  {group.category}
                </span>
              ) : null}

              {group.anyMissing ? (
                <span className="inline-flex items-center rounded-full border border-white/20 bg-[#1A1A1A] px-2.5 py-1 text-[11px] text-white/80">
                  Missing row(s)
                </span>
              ) : null}
            </div>

            <div className="text-xs text-white/60 mt-1">
              {group.productId}
              {group.slug ? ` • ${group.slug}` : ""} • {group.variants.length} variant(s)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {group.anyOOS ? (
            <span className="rounded-full bg-[#3A1012] px-3 py-1 text-xs text-red-100 border border-red-300/30">
              Has OOS
            </span>
          ) : (
            <span className="rounded-full bg-[#123426] px-3 py-1 text-xs text-emerald-100 border border-emerald-300/25">
              All in stock
            </span>
          )}

          <span className="rounded-full bg-[#0B1A14] px-3 py-1 text-xs text-white/80 border border-white/15">
            {group.totalSubscribers} subs
          </span>
          <span className="text-xs text-white/60">Updated {fmtWhen(group.updatedAtMax)}</span>

          <span className={`rounded-xl border ${GOLD_BORDER_STRONG} bg-[#123426] px-3 py-2 text-xs text-white`}>
            {isOpen ? "Collapse" : "Expand"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="px-4 pb-4">
          <div className={`overflow-x-auto rounded-xl border ${GOLD_BORDER_STRONG} bg-[#0B1A14]`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[rgba(245,215,122,0.35)] text-xs uppercase tracking-wide text-[var(--brand-gold)] bg-[#123426]">
                <tr>
                  <th className="px-4 py-3">Variant</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Subscribers</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {group.variants.map((r) => (
                  <VariantRow
                    key={keyFor(r.productId, r.variant)}
                    row={r}
                    busy={busyKey === keyFor(r.productId, r.variant)}
                    onSetQty={(qty) => onAction("setQty", r, qty)}
                    onReset={() => onAction("resetQty", r)}
                    onNotify={() => onAction("notify", r)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-xl border border-white/15 bg-[#0B1A14] px-3 py-2 text-xs text-white hover:brightness-110 transition"
              onClick={() => group.variants.forEach((r) => onAction("setQty", r, 5))}
            >
              Set all 5
            </button>
            <button
              className="rounded-xl border border-white/15 bg-[#0B1A14] px-3 py-2 text-xs text-white hover:brightness-110 transition"
              onClick={() => group.variants.forEach((r) => onAction("setQty", r, 10))}
            >
              Set all 10
            </button>
            <button
              className="rounded-xl border border-white/15 bg-[#0B1A14] px-3 py-2 text-xs text-white hover:brightness-110 transition"
              onClick={() => group.variants.forEach((r) => onAction("setQty", r, 20))}
            >
              Set all 20
            </button>
            <button
              className="rounded-xl border border-red-300/25 bg-[#3A1012] px-3 py-2 text-xs text-red-100 hover:brightness-110 transition"
              onClick={() => group.variants.forEach((r) => onAction("resetQty", r))}
            >
              Reset all to 0
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VariantRow({
  row,
  busy,
  onSetQty,
  onReset,
  onNotify,
}: {
  row: Row;
  busy: boolean;
  onSetQty: (qty: number) => void;
  onReset: () => void;
  onNotify: () => void;
}) {
  const [val, setVal] = useState(String(row.qty));

  useEffect(() => {
    setVal(String(row.qty));
  }, [row.qty]);

  const qtyNum = Number(val);
  const qtyValid = Number.isFinite(qtyNum) && qtyNum >= 0;
  const isOOS = row.qty <= 0;
  const missing = !!row.missingInventory;

  return (
    <tr className="border-b border-white/10 last:border-b-0 hover:brightness-110 transition">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="font-medium text-white">{row.variantLabel ?? row.variant ?? "—"}</div>
          {missing ? (
            <span className="rounded-full border border-white/15 bg-[#1A1A1A] px-2 py-0.5 text-[11px] text-white/80">
              missing inventory row
            </span>
          ) : null}
        </div>
        <div className="text-xs text-white/50">{row.variant ?? "null"}</div>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={busy || row.qty <= 0}
            onClick={() => onSetQty(Math.max(0, row.qty - 1))}
            className="rounded-lg border border-white/15 bg-[#0B1A14] px-2 py-1 text-xs text-white hover:brightness-110 disabled:opacity-50 transition"
            title="-1"
          >
            −
          </button>

          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className={`w-20 rounded-lg border px-2 py-1 text-sm outline-none ${
              qtyValid
                ? "border-[rgba(245,215,122,0.35)] bg-[#0B1A14] text-white"
                : "border-red-400 bg-[#3A1012] text-red-100"
            }`}
          />

          <button
            disabled={busy}
            onClick={() => onSetQty(row.qty + 1)}
            className="rounded-lg border border-white/15 bg-[#0B1A14] px-2 py-1 text-xs text-white hover:brightness-110 disabled:opacity-50 transition"
            title="+1"
          >
            +
          </button>

          <button
            disabled={busy || !qtyValid}
            onClick={() => onSetQty(Math.floor(Math.max(0, qtyNum)))}
            className="rounded-lg bg-[var(--brand-gold)] px-3 py-1 text-xs text-black hover:brightness-110 disabled:opacity-50 transition"
          >
            Save
          </button>

          <button
            disabled={busy}
            onClick={onReset}
            className="rounded-lg border border-red-300/25 bg-[#3A1012] px-2 py-1 text-[11px] text-red-100 hover:brightness-110 disabled:opacity-50 transition"
          >
            Reset 0
          </button>

          <button
            disabled={busy || row.subscribers <= 0}
            onClick={onNotify}
            className="rounded-lg border border-emerald-300/25 bg-[#123426] px-3 py-2 text-xs text-emerald-100 hover:brightness-110 disabled:opacity-50 transition"
            title="Send restock email(s) to current subscribers without changing qty"
          >
            Force resend
          </button>

          {isOOS ? (
            <span className="rounded-full border border-red-300/25 bg-[#3A1012] px-2 py-1 text-xs text-red-100">
              Out of stock
            </span>
          ) : (
            <span className="rounded-full border border-emerald-300/25 bg-[#123426] px-2 py-1 text-xs text-emerald-100">
              In stock
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="font-medium text-white">{row.subscribers}</div>
        <div className="text-xs text-white/50">requests</div>
      </td>

      <td className="px-4 py-3">
        <div className="text-sm text-white/80">{fmtWhen(row.updatedAt)}</div>
      </td>

      <td className="px-4 py-3">
        <div className="text-xs text-white/50">{busy ? "Working…" : "—"}</div>
      </td>
    </tr>
  );
}
