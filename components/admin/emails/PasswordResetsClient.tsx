"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  userId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
};

type StatusFilter = "ALL" | "PENDING" | "USED" | "EXPIRED";

function getSavedToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("leaflyx_admin_token") || "";
}

function statusOf(r: Row): "PENDING" | "USED" | "EXPIRED" {
  if (r.usedAt) return "USED";
  if (new Date(r.expiresAt).getTime() < Date.now()) return "EXPIRED";
  return "PENDING";
}

export default function PasswordResetsClient() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("PENDING");

  useEffect(() => {
    const saved = getSavedToken();
    if (saved) setToken(saved);
  }, []);

  function saveToken(t: string) {
    setToken(t);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("adminToken", t);
    }
  }

  const canFetch = useMemo(() => token.trim().length > 0, [token]);

  async function load() {
    if (!canFetch) {
      setMsg("Enter your admin token to load password reset tokens.");
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (status !== "ALL") sp.set("status", status);

      const res = await fetch(`/api/admin/emails/password?${sp.toString()}`, {
        headers: { "x-admin-token": token },
        cache: "no-store",
      });

      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { rows: Row[] };
      setRows(data.rows || []);
    } catch (e: any) {
      setRows([]);
      setMsg(e?.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canFetch) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const st = statusOf(r);
      if (status !== "ALL" && st !== status) return false;
      if (!needle) return true;
      return (
        r.email.toLowerCase().includes(needle) ||
        r.userId.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, status]);

  async function sendNew(email: string) {
    if (!confirm(`Send a NEW reset link to ${email}?`)) return;
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/emails/password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMsg(data?.message || "Reset email sent.");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Send failed.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteToken(id: string) {
    if (!confirm("Delete this reset token?")) return;
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/emails/password?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      if (!res.ok) throw new Error(await res.text());
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setMsg(e?.message || "Delete failed.");
    } finally {
      setLoading(false);
    }
  }

  async function cleanup() {
    if (!confirm("Delete USED + EXPIRED tokens?")) return;
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/emails/password?cleanup=1`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMsg(`Cleaned up ${data?.deleted ?? 0} tokens.`);
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Cleanup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* top tabs like your other sections */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/emails/restock"
          className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
        >
          Restock
        </Link>
        <Link
          href="/admin/emails/password"
          className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm text-white"
        >
          Password resets
        </Link>
        <Link
          href="/admin/emails/subscribers"
          className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
        >
          Subscribers
        </Link>
      </div>

      {/* token row */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <div className="text-sm text-white/70">Admin token</div>
            <input
              type="password"
              value={token}
              onChange={(e) => saveToken(e.target.value)}
              placeholder="Paste ADMIN_TOKEN"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--brand-gold)]"
            />
            <div className="mt-2 text-xs text-white/50">
              Stored locally in your browser (localStorage key: <code>adminToken</code>).
            </div>
          </div>

          <button
            onClick={load}
            disabled={!canFetch || loading}
            className="h-[46px] rounded-2xl bg-[var(--brand-gold)] px-6 text-sm font-semibold text-black disabled:opacity-60"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* filters + table */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search email / userId…"
              className="w-full md:w-[420px] rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--brand-gold)]"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="w-full md:w-[220px] rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-[var(--brand-gold)]"
            >
              <option value="PENDING">Pending</option>
              <option value="USED">Used</option>
              <option value="EXPIRED">Expired</option>
              <option value="ALL">All</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cleanup}
              disabled={!canFetch || loading}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 hover:bg-white/[0.06] disabled:opacity-60"
            >
              Cleanup used/expired
            </button>
          </div>
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
                <th className="py-3 text-left font-semibold">User</th>
                <th className="py-3 text-left font-semibold">Created</th>
                <th className="py-3 text-left font-semibold">Expires</th>
                <th className="py-3 text-left font-semibold">Status</th>
                <th className="py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="text-white/85">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-white/60">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-white/60">
                    No reset tokens found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const st = statusOf(r);
                  return (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="py-3">
                        <div className="font-medium">{r.email}</div>
                      </td>
                      <td className="py-3 text-white/70">
                        <div className="text-xs">{r.userId}</div>
                      </td>
                      <td className="py-3 text-white/70">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-white/70">
                        {new Date(r.expiresAt).toLocaleString()}
                      </td>
                      <td className="py-3">
                        {st === "PENDING" ? (
                          <span className="text-[var(--brand-gold)]">Pending</span>
                        ) : st === "USED" ? (
                          <span className="text-white/50">Used</span>
                        ) : (
                          <span className="text-white/50">Expired</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => sendNew(r.email)}
                            disabled={!canFetch || loading}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06] disabled:opacity-60"
                          >
                            Send new link
                          </button>
                          <button
                            onClick={() => deleteToken(r.id)}
                            disabled={!canFetch || loading}
                            className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.04] disabled:opacity-60"
                          >
                            Delete token
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-white/45">
          Note: “Send new link” generates a fresh token + email (old tokens can’t be resent because only hashes are stored).
        </div>
      </div>
    </div>
  );
}
