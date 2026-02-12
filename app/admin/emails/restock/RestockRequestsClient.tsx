// app/admin/emails/restock/RestockRequestsClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  email: string;
  productId: string;
  variant: string | null;
  createdAt: string;
};

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("ADMIN_TOKEN") || "";
}

export default function RestockRequestsClient() {
  const [adminToken, setAdminToken] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setAdminToken(getToken());
  }, []);

  function saveToken() {
    window.localStorage.setItem("ADMIN_TOKEN", adminToken.trim());
    setMsg("Token saved.");
    setTimeout(() => setMsg(null), 900);
  }

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const token = getToken() || adminToken.trim();
      const res = await fetch("/api/admin/emails/restock", {
        headers: { "x-admin-token": token },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { rows: Row[] };
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e: any) {
      setRows([]);
      setMsg(e?.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const token = getToken() || adminToken.trim();
      const res = await fetch(`/api/admin/emails/restock?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      if (!res.ok) throw new Error(await res.text());
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setMsg(e?.message || "Delete failed.");
    }
  }

  async function resend(id: string) {
    if (!confirm("Trigger resend for this request?")) return;
    setMsg(null);
    try {
      const token = getToken() || adminToken.trim();
      const res = await fetch("/api/admin/emails/restock", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setMsg(data?.message || "Resend triggered.");
      // if your API deletes after send, reflect it:
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setMsg(e?.message || "Resend failed.");
    }
  }

  return (
    <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      {/* Token bar (same pattern as Inventory) */}
      <div className="mb-5 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="text-xs text-white/60 mb-2">Admin Token</div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="Paste ADMIN_TOKEN"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--brand-gold)]"
          />
          <div className="flex gap-2">
            <button
              onClick={saveToken}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white hover:bg-white/[0.06]"
            >
              Save token
            </button>
            <button
              onClick={load}
              className="rounded-2xl bg-[var(--brand-gold)] px-4 py-2 text-sm font-semibold text-black hover:opacity-95"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email / productId / variant…"
          className="w-full md:w-[420px] rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--brand-gold)]"
        />
      </div>

      {msg ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/75">
          {msg}
        </div>
      ) : null}

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
            {loading ? (
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
                        onClick={() => resend(r.id)}
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
  );
}
