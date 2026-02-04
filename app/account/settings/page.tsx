"use client";

import { useEffect, useState } from "react";

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [handle, setHandle] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/public-profile", { method: "GET" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMsg("Could not load settings.");
        return;
      }
      setEnabled(!!data.user?.publicProfileEnabled);
      setHandle(data.user?.handle ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(next: boolean) {
    setMsg(null);

    if (next) {
      const ok = confirm(
        "Making your profile public allows it to be indexed by search engines (if enabled) and accessible by URL. Your order history, email, and private contact info will NOT be shown — but your name/handle and public bio may be visible.\n\nProceed?"
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/public-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicProfileEnabled: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "Update failed.");
        return;
      }
      setEnabled(next);
      setMsg(next ? "Public profile enabled." : "Public profile disabled.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-white">
      <h1 className="text-2xl font-semibold">Account settings</h1>
      <p className="mt-2 text-white/70">
        Privacy-first by default. You control what becomes public.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Public profile</div>
            <div className="mt-1 text-sm text-white/70">
              OFF by default. If enabled, your profile can be accessible by URL. We still never show
              order history or private contact info publicly.
            </div>

            <div className="mt-3 text-sm text-white/60">
              Public handle required:{" "}
              <span className="text-white/85">{handle ? `@${handle}` : "Not set"}</span>
            </div>
          </div>

          <button
            disabled={loading || saving}
            onClick={() => toggle(!enabled)}
            className={[
              "rounded-xl px-4 py-2 font-medium transition disabled:opacity-60",
              enabled ? "bg-white text-black" : "border border-white/15 bg-black/30 text-white",
            ].join(" ")}
          >
            {saving ? "Saving…" : enabled ? "Public: ON" : "Public: OFF"}
          </button>
        </div>

        {!handle ? (
          <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            You need to set a public handle before enabling a public profile.
            (We can add a handle editor next.)
          </div>
        ) : null}

        {msg ? <div className="mt-4 text-sm text-white/75">{msg}</div> : null}
      </div>
    </main>
  );
}
