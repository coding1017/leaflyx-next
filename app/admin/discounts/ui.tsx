"use client";

import React, { useEffect, useMemo, useState } from "react";

const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

type DiscountCodeRow = {
  id: string;
  code: string;
  description: string | null;
  ambassadorLabel: string | null;
  isActive: boolean;
  type: "PERCENT" | "AMOUNT";
  percentOff: number | null;
  amountOffCents: number | null;
  minSubtotalCents: number | null;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AnalyticsRow = {
  code: string;
  uses: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  lastUsedAt: string | null;
  topItems: { name: string; qty: number }[];
};

export default function DiscountsAdminClient() {
  const [codes, setCodes] = useState<DiscountCodeRow[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);

  // create form
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAmb, setNewAmb] = useState("");
  const [newType, setNewType] = useState<"PERCENT" | "AMOUNT">("PERCENT");
  const [newPercent, setNewPercent] = useState(10);
  const [newAmount, setNewAmount] = useState(500);
  const [newActive, setNewActive] = useState(true);

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    setOk(null);

    const [a, b] = await Promise.all([
      fetch("/api/admin/discounts", { cache: "no-store" }),
      fetch("/api/admin/discounts/analytics", { cache: "no-store" }),
    ]);

    const aj = await a.json();
    const bj = await b.json();

    if (!aj.ok) setErr(aj.error ?? "Failed to load codes.");
    else setCodes(aj.codes);

    if (!bj.ok) setErr(bj.error ?? "Failed to load analytics.");
    else setAnalytics(bj.summary);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const analyticsByCode = useMemo(() => {
    const map = new Map<string, AnalyticsRow>();
    for (const row of analytics) map.set(row.code, row);
    return map;
  }, [analytics]);

  async function createCode() {
    setErr(null);
    setOk(null);

    const code = newCode.trim().toUpperCase();
    if (!code) return setErr("Enter a code.");

    const payload: any = {
      code,
      description: newDesc.trim() || null,
      ambassadorLabel: newAmb.trim() || null,
      isActive: newActive,
      type: newType,
      percentOff: newType === "PERCENT" ? Math.min(50, Math.max(1, newPercent)) : undefined,
      amountOffCents: newType === "AMOUNT" ? Math.max(1, newAmount) : undefined,
    };

    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await res.json();
    if (!j.ok) return setErr(j.error ?? "Create failed.");

    setOk("Created.");
    setNewCode("");
    setNewDesc("");
    setNewAmb("");
    await load();
  }

  async function patch(id: string, data: Partial<DiscountCodeRow>) {
    setErr(null);
    setOk(null);

    // enforce 50% guard client-side too (server also enforces)
    const payload: any = { ...data };
    if (payload.type === "PERCENT" && payload.percentOff != null) {
      payload.percentOff = Math.min(50, Math.max(1, Number(payload.percentOff)));
    }

    const res = await fetch(`/api/admin/discounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await res.json();
    if (!j.ok) return setErr(j.error ?? "Update failed.");

    setOk("Updated.");
    await load();
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md p-6 text-white/70">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create */}
      <div className="rounded-3xl border border-[var(--brand-gold)]/50 bg-black/20 backdrop-blur-md p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xl font-semibold">Create discount code</div>
            <div className="text-sm text-white/60 mt-1">
              Percent codes are automatically capped at 50%.
            </div>
          </div>

          <button
            onClick={createCode}
            className="btn-gold rounded-full px-5 py-2 font-medium border border-[var(--brand-gold)]"
          >
            Create
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">
            <div className="text-white/70 mb-1">Code</div>
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="AMBASSADOR10"
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-[var(--brand-gold)]/70"
            />
          </label>

          <label className="text-sm">
            <div className="text-white/70 mb-1">Ambassador label (optional)</div>
            <input
              value={newAmb}
              onChange={(e) => setNewAmb(e.target.value)}
              placeholder="Creator name / ID"
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-[var(--brand-gold)]/70"
            />
          </label>

          <label className="text-sm md:col-span-2">
            <div className="text-white/70 mb-1">Description (optional)</div>
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="10% off for ambassador program"
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-[var(--brand-gold)]/70"
            />
          </label>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm text-white/70">Type</div>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="rounded-full bg-black/40 border border-white/10 px-4 py-2 text-sm"
            >
              <option value="PERCENT">Percent off</option>
              <option value="AMOUNT">Amount off</option>
            </select>

            {newType === "PERCENT" ? (
              <label className="text-sm flex items-center gap-2">
                <span className="text-white/70">Percent</span>
                <input
                  type="number"
                  value={newPercent}
                  min={1}
                  max={50}
                  onChange={(e) => setNewPercent(Number(e.target.value))}
                  className="w-24 rounded-full bg-black/40 border border-white/10 px-4 py-2 text-sm"
                />
                <span className="text-white/60">%</span>
              </label>
            ) : (
              <label className="text-sm flex items-center gap-2">
                <span className="text-white/70">Amount</span>
                <input
                  type="number"
                  value={newAmount}
                  min={1}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  className="w-28 rounded-full bg-black/40 border border-white/10 px-4 py-2 text-sm"
                />
                <span className="text-white/60">cents</span>
              </label>
            )}

            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={newActive}
                onChange={(e) => setNewActive(e.target.checked)}
              />
              <span className="text-white/70">Active</span>
            </label>
          </div>

          {err ? <div className="text-sm text-red-200">{err}</div> : null}
          {ok ? <div className="text-sm text-emerald-200">{ok}</div> : null}
        </div>
      </div>

      {/* List */}
      <div className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md p-6">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">Codes</div>
          <button
            onClick={load}
            className="rounded-full px-4 py-2 text-sm border border-white/10 bg-black/30 hover:bg-black/50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {codes.map((c) => {
            const a = analyticsByCode.get(c.code);
            return (
              <div
                key={c.id}
                className="rounded-3xl border border-[var(--brand-gold)]/25 bg-black/30 p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-lg font-semibold">
                      <span className="text-[var(--brand-gold)]">{c.code}</span>{" "}
                      <span className="text-white/60 text-sm">
                        {c.isActive ? "• Active" : "• Inactive"}
                      </span>
                    </div>
                    {c.description ? (
                      <div className="text-sm text-white/60 mt-1">{c.description}</div>
                    ) : null}
                    {c.ambassadorLabel ? (
                      <div className="text-sm text-white/60 mt-1">
                        Ambassador: <span className="text-white/80">{c.ambassadorLabel}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="text-sm text-white/70">
                    <div>
                      Discount:{" "}
                      <span className="text-white">
                        {c.type === "PERCENT"
                          ? `${c.percentOff ?? 0}%`
                          : usd(c.amountOffCents ?? 0)}
                      </span>
                    </div>
                    <div>
                      Uses (db): <span className="text-white">{c.usesCount}</span>
                      {c.maxUses != null ? (
                        <span className="text-white/60"> / {c.maxUses}</span>
                      ) : null}
                    </div>
                    {a ? (
                      <div className="mt-2 text-white/60">
                        Revenue: <span className="text-white">{usd(a.totalCents)}</span> •{" "}
                        Saved: <span className="text-white">{usd(a.discountCents)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* quick toggles */}
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => patch(c.id, { isActive: !c.isActive })}
                    className="rounded-full px-4 py-2 text-sm border border-white/10 bg-black/30 hover:bg-black/50"
                  >
                    {c.isActive ? "Disable" : "Enable"}
                  </button>

                  {c.type === "PERCENT" ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/60">Percent</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        defaultValue={c.percentOff ?? 10}
                        onBlur={(e) => patch(c.id, { type: "PERCENT", percentOff: Number(e.target.value) } as any)}
                        className="w-24 rounded-full bg-black/40 border border-white/10 px-4 py-2"
                      />
                      <span className="text-white/60">%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/60">Amount</span>
                      <input
                        type="number"
                        min={1}
                        defaultValue={c.amountOffCents ?? 500}
                        onBlur={(e) =>
                          patch(c.id, { type: "AMOUNT", amountOffCents: Number(e.target.value) } as any)
                        }
                        className="w-28 rounded-full bg-black/40 border border-white/10 px-4 py-2"
                      />
                      <span className="text-white/60">cents</span>
                    </div>
                  )}
                </div>

                {a?.topItems?.length ? (
                  <div className="mt-4 text-sm text-white/60">
                    Top items:{" "}
                    <span className="text-white/80">
                      {a.topItems.map((t) => `${t.name} (${t.qty})`).join(", ")}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
