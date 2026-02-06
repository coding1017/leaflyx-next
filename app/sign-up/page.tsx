// app/sign-up/page.tsx
"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import BirthdayPicker from "@/components/account/BirthdayPicker";

export const dynamic = "force-dynamic";

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim().toLowerCase());
}

function strengthScore(pw: string) {
  const s = pw || "";
  let score = 0;

  const lengthOK = s.length >= 10;
  const long = s.length >= 14;

  const hasLower = /[a-z]/.test(s);
  const hasUpper = /[A-Z]/.test(s);
  const hasNum = /[0-9]/.test(s);
  const hasSym = /[^A-Za-z0-9]/.test(s);

  const variety = [hasLower, hasUpper, hasNum, hasSym].filter(Boolean).length;

  if (lengthOK) score += 1;
  if (long) score += 1;
  if (variety >= 2) score += 1;
  if (variety >= 3) score += 1;
  if (variety >= 4) score += 1;

  return Math.min(4, score); // 0..4
}

const labels = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];

function isYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function normalizeBirthdayInput(raw: string): string {
  const s = (raw || "").trim();
  if (!s) return "";

  if (isYYYYMMDD(s)) return s;

  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const mm = String(mdy[1]).padStart(2, "0");
    const dd = String(mdy[2]).padStart(2, "0");
    const yyyy = mdy[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  const mdy2 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdy2) {
    const mm = String(mdy2[1]).padStart(2, "0");
    const dd = String(mdy2[2]).padStart(2, "0");
    const yyyy = mdy2[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return "";
}

function is21OrOlder(yyyy_mm_dd: string) {
  if (!isYYYYMMDD(yyyy_mm_dd)) return false;

  const dob = new Date(`${yyyy_mm_dd}T00:00:00Z`);
  if (isNaN(dob.getTime())) return false;

  const now = new Date();
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear() - 21, now.getUTCMonth(), now.getUTCDate())
  );

  return dob <= cutoff;
}

export default function SignUpPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("callbackUrl") || "/account";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  // ✅ NEW
  const [birthday, setBirthday] = useState(""); // "" or YYYY-MM-DD
  const [birthdayHint, setBirthdayHint] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const score = useMemo(() => strengthScore(pw), [pw]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const e2 = email.trim().toLowerCase();

    if (!isEmail(e2)) return setMsg("Please enter a valid email.");
    if (pw.trim().length < 10) return setMsg("Password must be at least 10 characters.");
    if (pw !== pw2) return setMsg("Passwords do not match.");

    // ✅ Birthday required + 21+ (recommended for Leaflyx)
    const b = normalizeBirthdayInput(birthday);
    if (!b) return setMsg("Please enter your birthday.");
    if (!is21OrOlder(b)) return setMsg("You must be 21+ to create an account.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: e2,
          password: pw,
          birthday: b, // ✅ NEW
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "Sign up failed.");
        return;
      }

      // Auto-login after successful signup
      const login = await signIn("credentials", {
        email: e2,
        password: pw,
        redirect: false,
        callbackUrl: next,
      });

      if (!login || login.error) {
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(next)}`);
        router.refresh();
        return;
      }

      router.push(login.url || next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10 text-white">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="mt-2 text-white/70">
        Private by default. Nothing becomes public unless you opt in.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />

        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          inputMode="email"
        />

        {/* ✅ NEW: Birthday */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs uppercase tracking-wide text-white/60">
              Birthday
            </label>
            <div className="text-xs text-white/45">Required (21+)</div>
          </div>

          <BirthdayPicker
            value={birthday}
            onChange={(v) => {
              const normalized = normalizeBirthdayInput(v);
              setBirthday(normalized);
              setBirthdayHint(v && !normalized ? "Use YYYY-MM-DD (or pick from the calendar)." : null);
            }}
            disabled={loading}
          />

          {birthdayHint ? (
            <div className="mt-2 text-xs text-red-200/90">{birthdayHint}</div>
          ) : (
            <div className="mt-2 text-xs text-white/60">
              Used for age verification and account compliance.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40"
            placeholder="Password (10+ characters)"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="new-password"
          />

          {/* Strength meter */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Password strength</span>
              <span className="text-white/80">{labels[score]}</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/70 transition-all"
                style={{ width: `${(score / 4) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-white/60">
              Tip: 14+ chars + mix of upper/lower, numbers, symbols.
            </div>
          </div>

          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40"
            placeholder="Confirm password"
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {msg ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {msg}
          </div>
        ) : null}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <div className="text-sm text-white/65">
          Already have an account?{" "}
          <a className="text-white underline underline-offset-4" href="/sign-in">
            Sign in
          </a>
        </div>
      </form>
    </main>
  );
}
