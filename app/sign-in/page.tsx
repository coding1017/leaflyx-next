"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp.get("callbackUrl") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

   const res = await signIn("credentials", {
  email: email.trim().toLowerCase(),
  password,
  redirect: false,
  callbackUrl: next,
});

    setLoading(false);

    if (!res || res.error) {
      setMsg("Invalid email or password.");
      return;
    }

    router.push(res.url || next);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold text-white">Sign in</h1>
      <p className="mt-2 text-white/70">Private account access for orders, profile, and settings.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {msg ? <div className="text-sm text-red-300">{msg}</div> : null}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-white px-4 py-3 text-black font-medium disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
<div className="text-sm text-white/65">
  <a className="text-white underline underline-offset-4" href="/forgot-password">
    Forgot password?
  </a>
</div>


        <div className="text-sm text-white/65">
          New here?{" "}
          <a
            className="text-white underline underline-offset-4"
            href={`/sign-up?callbackUrl=${encodeURIComponent(next)}`}
          >
            Create an account
          </a>
        </div>
      </form>
    </main>
  );
}
