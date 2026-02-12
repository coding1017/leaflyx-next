"use client";

import { useEffect, useMemo, useState } from "react";
import EmailsTabs from "./EmailsTabs";

type Row = {
  id: string;
  email: string;
  status: string;
  source: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  unsubscribedAt: string | null;
};

function getAdminToken() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("adminToken") ||
    window.localStorage.getItem("ADMIN_TOKEN") ||
    ""
  );
}

export default function SubscribersClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "UNSUBSCRIBED">("ALL");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const token = getAdminToken();
      const url = `/api/admin/emails/subscribers?status=${status}&q=${encodeURIComponent(q.trim())}`;
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

  async function setSubStatus(id: string, next: "ACTIVE" | "UNSUBSCRIBED") {
    setMsg(null);
    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/emails/subscribers", {
        method: "PATCH",
        headers: {
          "x-admin-token": token,
          "content-type": "application/json",
        },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("Updated.");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Update failed.");
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this subscriber?")) return;
    setMsg(null);
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/admin/emails/subscribers?id=${encodeURIComponent(id)}`, {
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

      <h2 className="text-3xl font-semibold">Subscribers</h2>
      <p className="mt-2 text-white/60">View and manage your newsletter / marketing list.</p>

      <div className="mt-5 rounded-3xl border border-white/15 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search email / source / tags…"
              className="w-full md:w-[360px] rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--brand-gold)]"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
            </select>
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
                <th className="py-3 text-left font-semibold">Email</th>
                <th className="py-3 text-left font-semibold">Status</th>
                <th className="py-3 text-left font-semibold">Source</th>
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
              ) : display.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-white/60">
                    No subscribers found.
                  </td>
                </tr>
              ) : (
                display.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-3">
                      <div className="font-medium">{r.email}</div>
                      {r.tags ? <div className="text-xs text-white/50 mt-1">Tags: {r.tags}</div> : null}
                    </td>
                    <td className="py-3">
                      {String(r.status).toUpperCase() === "ACTIVE" ? (
                        <span className="text-[var(--brand-gold)]">ACTIVE</span>
                      ) : (
                        <span className="text-white/50">UNSUBSCRIBED</span>
                      )}
                    </td>
                    <td className="py-3 text-white/70">{r.source ?? "—"}</td>
                    <td className="py-3 text-white/70">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {String(r.status).toUpperCase() === "ACTIVE" ? (
                          <button
                            onClick={() => setSubStatus(r.id, "UNSUBSCRIBED")}
                            className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.04]"
                          >
                            Unsubscribe
                          </button>
                        ) : (
                          <button
                            onClick={() => setSubStatus(r.id, "ACTIVE")}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
                          >
                            Reactivate
                          </button>
                        )}
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
