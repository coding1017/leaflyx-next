"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10 text-white">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-2 text-white/70">
        Enter your email and we’ll send a password reset link (if an account exists).
      </p>

      {done ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80">
          If that email exists, you’ll receive a reset link shortly.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </main>
  );
}
