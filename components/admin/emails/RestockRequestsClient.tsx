"use client";

import React, { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  email: string;
  productId: string;
  variant: string | null;
  createdAt: string;
};

type ApiResp = { rows: Row[] } | { error: string; detail?: string };

function getSavedToken() {
  if (typeof window === "undefined") return "";
  // ✅ match your Reviews page exactly
  return window.localStorage.getItem("adminToken") || "";
}

export default function RestockRequestsClient() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // load saved token from localStorage
  useEffect(() => {
    const saved = getSavedToken();
    if (saved) setToken(saved);
  }, []);

  const canFetch = useMemo(() => token.trim().length > 0, [token]);

  function saveToken(t: string) {
    setToken(t);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("adminToken", t);
    }
  }

  async function load() {
    if (!canFetch) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/emails/restock", {
        headers: { "x-admin-token": token },
        cache: "no-store",
      });

      const data = (await res.json().catch(() => ({}))) as ApiResp;

      if (!res.ok) {
        const err = "error" in data ? data.error : await res.text();
        throw new Error(err || `HTTP ${res.status}`);
      }

      if ("error" in data) throw new Error(data.error);

      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e: any) {
      setRows([]);
      setMsg(e?.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  // first load when token exists
  useEffect(() => {
    if (canFetch) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((r) => {
      return (
        r.email.toLowerCase().includes(needle) ||
        r.productId.toLowerCase().includes(needle) ||
        (r.variant || "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q]);

  async function deleteRow(id: string) {
    if (!confirm("Delete this restock request?")) return;
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/emails/restock?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data as any)?.error) throw new Error((data as any)?.error || `HTTP ${res.status}`);

      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setMsg(e?.message || "Delete failed.");
    }
  }

  async function resendById(id: string) {
    setMsg(null);

    try {
      const res = await fetch("/api/admin/emails/restock/resend", {
        method: "POST",
        headers: {
          "x-admin-token": token,
          "content-type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data as any)?.error) throw new Error((data as any)?.error || `HTTP ${res.status}`);

      setMsg((data as any)?.message || "Resend triggered.");
      await load(); // refresh list (some implementations delete after send)
    } catch (e: any) {
      setMsg(e?.message || "Resend failed.");
    }
  }

  return (
    <div className="space-y-6">
      {/* ✅ Token bar */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="grid gap-3 sm:grid-cols-3 items-end">
          <div className="sm:col-span-2">
            <label className="text-sm mb-1 block">Admin token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => saveToken(e.target.value)}
              placeholder="Enter ADMIN_TOKEN"
              className="w-full rounded-lg bg-black/50 border border-white/15 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-gold)]"
            />
            <p className="text-xs opacity-70 mt-1">
              Stored locally in your browser (localStorage key: <code>adminToken</code>).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={load}
              disabled={!canFetch || loading}
              className="flex-1 rounded-lg px-4 py-2 border border-[var(--brand-gold)] text-sm btn-gold disabled:opacity-60"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {msg ? (
          <div className="mt-3 text-sm text-white/80">
            <strong>Notice:</strong> {msg}
          </div>
        ) : null}
      </div>

      {/* Search + table */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email / productId / variant…"
            className="w-full md:w-[420px] rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--brand-gold)]"
          />
          <button
            onClick={load}
            disabled={!canFetch || loading}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white hover:bg-white/[0.06] disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-white/70">
              <tr className="border-b border-white/10">
                <th className="py-3 text-left font-semibold">Email</th>
                <th className="py-3 text-left font-semibold">Product</th>
                <th className="py-3 text-left font-semibold">Variant</th>
                <th className="py-3 text-left font-semibold">Created</th>
                <th className="py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="text-white/85">
              {!canFetch ? (
                <tr>
                  <td colSpan={5} className="py-6 text-white/60">
                    Enter your admin token to load requests.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-white/60">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-white/60">
                    No rows found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-3">{r.email}</td>
                    <td className="py-3 text-white/80">{r.productId}</td>
                    <td className="py-3 text-white/80">{r.variant ?? "—"}</td>
                    <td className="py-3 text-white/70">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => resendById(r.id)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => deleteRow(r.id)}
                          className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.04]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
