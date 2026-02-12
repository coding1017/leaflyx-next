"use client";

import { useEffect, useMemo, useState } from "react";
import EmailsTabs from "./EmailsTabs";

type Row = {
  id: string;
  userEmail: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  status: "ACTIVE" | "USED" | "EXPIRED";
};

function getAdminToken() {
  if (typeof window === "undefined") return "";
  // support BOTH keys you used across pages
  return (
    window.localStorage.getItem("adminToken") ||
    window.localStorage.getItem("ADMIN_TOKEN") ||
    ""
  );
}

export default function PasswordResetsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const token = getAdminToken();
      const url = `/api/admin/emails/password-resets?show=${showAll ? "all" : "active"}&q=${encodeURIComponent(
        q.trim()
      )}`;
      const res = await fetch(url, {
        headers: { "x-admin-token": token },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { rows: Row[] };
      setRows(data.rows || []);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const display = useMemo(() => rows, [rows]);

  async function resend(id: string) {
    if (!confirm("Send a NEW reset email for this user? (Old token will be marked used)")) return;
    setMsg(null);
    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/emails/password-resets", {
        method: "POST",
        headers: {
          "x-admin-token": token,
          "content-type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("Reset email sent.");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Resend failed.");
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this reset token?")) return;
    setMsg(null);
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/admin/emails/password-resets?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      if (!res.ok) throw new Error(await res.text());
      setRows((p) => p.filter((r) => r.id !== id));
    } catch (e: any) {
      setMsg(e?.message || "Delete failed.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <EmailsTabs />

      <h2 className="text-3xl font-semibold">Password reset requests</h2>
      <p className="mt-2 text-white/60">
        View reset tokens. Resend generates a <span className="text-white/85">new token</span> and emails it.
      </p>

      <div className="mt-5 rounded-3xl border border-white/15 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search email…"
              className="w-full md:w-[360px] rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--brand-gold)]"
            />
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              Show all (used/expired)
            </label>
          </div>

          <button
            onClick={load}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white hover:bg-white/[0.06]"
          >
            Refresh
          </button>
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
                  <td colSpan={5} className="py-6 text-white/60">
                    Loading…
                  </td>
                </tr>
              ) : display.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-white/60">
                    No rows found.
                  </td>
                </tr>
              ) : (
                display.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-3">{r.userEmail}</td>
                    <td className="py-3 text-white/70">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="py-3 text-white/70">{new Date(r.expiresAt).toLocaleString()}</td>
                    <td className="py-3">
                      {r.status === "ACTIVE" ? (
                        <span className="text-[var(--brand-gold)]">Active</span>
                      ) : r.status === "USED" ? (
                        <span className="text-white/50">Used</span>
                      ) : (
                        <span className="text-white/50">Expired</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => resend(r.id)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => del(r.id)}
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
