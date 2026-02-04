// app/admin/inventory/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Row = {
  productId: string;
  productName: string;
  slug: string | null;

  variant: string | null; // "1g"
  variantLabel: string | null; // "1 g"
  qty: number;

  updatedAt: string; // ISO
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

/**
 * Numeric ordering for variants like:
 * 1g, 3.5g, 7g, 14g, 28g
 *
 * Handles messy strings too:
 * "1 g", "1 g (1g)", "28 g", etc.
 */
function variantSortKey(row: Row) {
  const raw = String(row.variant ?? row.variantLabel ?? "")
    .trim()
    .toLowerCase();

  // Remove spaces and also strip parentheses content:
  // "1 g (1g)" -> "1g"
  const cleaned = raw
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, "")
    .trim();

  // If nothing (non-variant), push last
  if (!cleaned) return { unitRank: 9, value: Number.POSITIVE_INFINITY, tie: "" };

  // grams: 3.5g
  const g = cleaned.match(/^(\d+(?:\.\d+)?)g$/);
  if (g) return { unitRank: 0, value: Number(g[1]), tie: cleaned };

  // ounces: 1oz
  const oz = cleaned.match(/^(\d+(?:\.\d+)?)oz$/);
  if (oz) return { unitRank: 1, value: Number(oz[1]), tie: cleaned };

  // mg: 500mg
  const mg = cleaned.match(/^(\d+(?:\.\d+)?)mg$/);
  if (mg) return { unitRank: 2, value: Number(mg[1]), tie: cleaned };

  // fallback lexical
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

  // Sort variants numerically
  for (const pid of Object.keys(map)) {
    map[pid].variants.sort((a, b) => {
      const ak = variantSortKey(a);
      const bk = variantSortKey(b);

      if (ak.unitRank !== bk.unitRank) return ak.unitRank - bk.unitRank;
      if (ak.value !== bk.value) return ak.value - bk.value;
      return ak.tie.localeCompare(bk.tie);
    });
  }

  // Sort products by name
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

      // open first 5 by default (preserve existing toggles)
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
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
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

  async function createMissingAll() {
    if (!token) return;
    setError(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ action: "createMissing" }),
      });

      const data = await res.json();
      setLastResult(data);

      if (!data.ok) throw new Error(data.error || "Failed to create missing rows");
      await fetchList();
    } catch (e: any) {
      setError(e?.message ?? "Failed");
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Admin Inventory</h1>
      <p className="text-sm opacity-80 mt-1">
        Grouped by product • thumbnails • numeric variant order • presets • create-missing rows
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

          <div className="flex flex-wrap gap-2">
            <button
              onClick={saveToken}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            >
              Save token
            </button>

            <button
              onClick={fetchList}
              className="rounded-xl bg-yellow-500/20 px-4 py-2 text-sm hover:bg-yellow-500/30"
            >
              Refresh
            </button>

            <button
              onClick={createMissingAll}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              title="Creates Inventory rows for any products/variants that exist in lib/products.ts but not in Prisma Inventory"
            >
              Create missing rows
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product / id / slug / variant…"
              className="w-full md:w-[420px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />

            <label className="flex items-center gap-2 text-sm opacity-80">
              <input
                type="checkbox"
                checked={showOnlySubscribed}
                onChange={(e) => setShowOnlySubscribed(e.target.checked)}
              />
              Subscribers only
            </label>

            <label className="flex items-center gap-2 text-sm opacity-80">
              <input
                type="checkbox"
                checked={showOnlyOOS}
                onChange={(e) => setShowOnlyOOS(e.target.checked)}
              />
              Out of stock only
            </label>

            <label className="flex items-center gap-2 text-sm opacity-80">
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
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
            >
              Expand all
            </button>

            <button
              onClick={() => {
                const next: Record<string, boolean> = {};
                for (const pid of Object.keys(grouped)) next[pid] = false;
                setOpen(next);
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
            >
              Collapse all
            </button>
          </div>

          {loading ? (
            <div className="text-sm opacity-70">Loading…</div>
          ) : (
            <div className="text-sm opacity-70">
              {productCount} products • {variantCount} variants
            </div>
          )}
        </div>

        {error ? (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
            {error}
          </div>
        ) : null}

        {lastResult ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
            <div className="opacity-70 mb-1">Last action result</div>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(lastResult, null, 2)}</pre>
          </div>
        ) : null}
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
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm opacity-70">
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
  const href = group.slug ? `/shop/p/${group.slug}` : null;

  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-black/30 overflow-hidden",
        "transition-shadow",
        // subtle glow ring on hover
        "hover:shadow-[0_0_0_1px_rgba(234,179,8,0.18),0_0_24px_rgba(16,185,129,0.10)]",
      ].join(" ")}
    >
      <button
        onClick={() => setOpen(!isOpen)}
        className="w-full text-left px-4 py-4 hover:bg-white/5 flex items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="relative mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {group.image ? (
              <Image
                src={group.image}
                alt={group.productName}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-[10px] opacity-60">No image</div>
            )}
          </div>

          <div>
            <div className="text-lg font-semibold underline underline-offset-4">
              {href ? (
                <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  {group.productName}
                </a>
              ) : (
                group.productName
              )}
            </div>

            {group.category ? (
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] opacity-85">
                  {group.category}
                </span>
              </div>
            ) : null}

            <div className="text-xs opacity-70 mt-1">
              {group.productId}
              {group.slug ? ` • ${group.slug}` : ""} • {group.variants.length} variant(s)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {group.anyMissing ? (
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
              Missing row(s)
            </span>
          ) : null}

          {group.anyOOS ? (
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-200">Has OOS</span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200">
              All in stock
            </span>
          )}

          <span className="rounded-full bg-white/5 px-3 py-1 text-xs opacity-80">{group.totalSubscribers} subs</span>
          <span className="text-xs opacity-70">Updated {fmtWhen(group.updatedAtMax)}</span>

          <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
            {isOpen ? "Collapse" : "Expand"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="px-4 pb-4">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide opacity-70">
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
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              onClick={() => group.variants.forEach((r) => onAction("setQty", r, 5))}
            >
              Set all 5
            </button>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              onClick={() => group.variants.forEach((r) => onAction("setQty", r, 10))}
            >
              Set all 10
            </button>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              onClick={() => group.variants.forEach((r) => onAction("setQty", r, 20))}
            >
              Set all 20
            </button>
            <button
              className="rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-200 hover:bg-red-500/25"
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
    <tr className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="font-medium">{row.variantLabel ?? row.variant ?? "—"}</div>

          {/* ghost badge when missing */}
          {missing ? (
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
              missing inventory row
            </span>
          ) : null}
        </div>
        <div className="text-xs opacity-70">{row.variant ?? "null"}</div>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={busy || row.qty <= 0}
            onClick={() => onSetQty(Math.max(0, row.qty - 1))}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-40"
            title="-1"
          >
            −
          </button>

          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className={`w-20 rounded-lg border px-2 py-1 text-sm ${
              qtyValid ? "border-white/10 bg-black/40" : "border-red-500/40 bg-red-500/10"
            }`}
          />

          <button
            disabled={busy}
            onClick={() => onSetQty(row.qty + 1)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-40"
            title="+1"
          >
            +
          </button>

          <button
            disabled={busy || !qtyValid}
            onClick={() => onSetQty(Math.floor(Math.max(0, qtyNum)))}
            className="rounded-lg bg-yellow-500/20 px-3 py-1 text-xs hover:bg-yellow-500/30 disabled:opacity-40"
          >
            Save
          </button>

          {/* presets */}
          <button
            disabled={busy}
            onClick={() => onSetQty(5)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10 disabled:opacity-40"
          >
            Set 5
          </button>
          <button
            disabled={busy}
            onClick={() => onSetQty(10)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10 disabled:opacity-40"
          >
            Set 10
          </button>
          <button
            disabled={busy}
            onClick={() => onSetQty(20)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10 disabled:opacity-40"
          >
            Set 20
          </button>

          <button
            disabled={busy}
            onClick={onReset}
            className="rounded-lg bg-red-500/15 px-2 py-1 text-[11px] text-red-200 hover:bg-red-500/25 disabled:opacity-40"
          >
            Reset 0
          </button>

          <button
            disabled={busy || row.subscribers <= 0}
            onClick={onNotify}
            className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-40"
            title="Send restock email(s) to current subscribers without changing qty"
          >
            Force resend
          </button>

          {isOOS ? (
            <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs text-red-200">Out of stock</span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-200">In stock</span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="font-medium">{row.subscribers}</div>
        <div className="text-xs opacity-70">requests</div>
      </td>

      <td className="px-4 py-3">
        <div className="text-sm">{fmtWhen(row.updatedAt)}</div>
      </td>

      <td className="px-4 py-3">
        <div className="text-xs opacity-70">{busy ? "Working…" : "—"}</div>
      </td>
    </tr>
  );
}
