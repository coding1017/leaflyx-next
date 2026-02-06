// app/reset-password/ResetPasswordClient.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) return setMsg("Missing token.");
    if (pw.length < 10) return setMsg("Password must be at least 10 characters.");
    if (pw !== pw2) return setMsg("Passwords do not match.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "Reset failed.");
        return;
      }
      setMsg("Password updated. Redirecting to sign in…");
      setTimeout(() => router.push("/sign-in"), 800);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10 text-white">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="mt-2 text-white/70">Choose a new password for your account.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          placeholder="New password (10+ chars)"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
        />
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          placeholder="Confirm new password"
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          autoComplete="new-password"
        />

        {msg ? <div className="text-sm text-white/80">{msg}</div> : null}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
