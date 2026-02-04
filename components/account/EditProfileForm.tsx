"use client";

import { useEffect, useMemo, useState } from "react";
import BirthdayPicker from "@/components/account/BirthdayPicker";

type Profile = {
  email: string;
  name: string | null;
  handle: string | null;
  birthday?: string | Date | null;

  // ✅ private fields (may or may not come back from API yet)
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postal?: string | null;
  country?: string | null;
};

function handlePreview(v: string) {
  return v.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

function toDateInputValue(v: any): string {
  if (!v) return "";
  try {
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return "";
  }
}

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

export default function EditProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  // existing fields
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [birthday, setBirthday] = useState(""); // "" or YYYY-MM-DD
  const [birthdayHint, setBirthdayHint] = useState<string | null>(null);

  // ✅ private shipping fields
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateProv, setStateProv] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("US");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setOk(null);

        const res = await fetch("/api/account/profile", { method: "GET" });
        const data = await res.json();

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Failed to load profile.");
        }

        const u = data.user as Profile;
        if (cancelled) return;

        setProfile(u);
        setName(u?.name ?? "");
        setHandle(u?.handle ?? "");
        setBirthday(toDateInputValue(u?.birthday));

        // ✅ hydrate private fields if API returns them (safe if undefined)
        setPhone((u?.phone ?? "") as string);
        setAddress1((u?.address1 ?? "") as string);
        setAddress2((u?.address2 ?? "") as string);
        setCity((u?.city ?? "") as string);
        setStateProv((u?.state ?? "") as string);
        setPostal((u?.postal ?? "") as string);
        setCountry(((u?.country ?? "US") as string) || "US");
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedHandle = useMemo(() => handlePreview(handle), [handle]);
  const handleChanged = normalizedHandle !== (profile?.handle ?? "");
  const birthdayChanged = birthday !== toDateInputValue(profile?.birthday);
  const nameChanged = name.trim() !== (profile?.name ?? "");

  const addressChanged =
    phone.trim() !== (profile?.phone ?? "") ||
    address1.trim() !== (profile?.address1 ?? "") ||
    address2.trim() !== (profile?.address2 ?? "") ||
    city.trim() !== (profile?.city ?? "") ||
    stateProv.trim() !== (profile?.state ?? "") ||
    postal.trim() !== (profile?.postal ?? "") ||
    country.trim() !== (profile?.country ?? "US");

  const hasUnsaved = handleChanged || birthdayChanged || nameChanged || addressChanged;

  const hasAddressOnFile = useMemo(() => {
    return Boolean(
      address1.trim() || city.trim() || stateProv.trim() || postal.trim()
    );
  }, [address1, city, stateProv, postal]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOk(null);

    try {
      const payloadBirthday = birthday ? normalizeBirthdayInput(birthday) : "";

      if (birthday && !payloadBirthday) {
        throw new Error("Birthday must be in YYYY-MM-DD format.");
      }

      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // existing payload
          name: name.trim(),
          handle: normalizedHandle.trim(),
          birthday: payloadBirthday || null,

          // ✅ private shipping payload (safe if API ignores unknown keys)
          phone: phone.trim() || null,
          address1: address1.trim() || null,
          address2: address2.trim() || null,
          city: city.trim() || null,
          state: stateProv.trim() || null,
          postal: postal.trim() || null,
          country: country.trim() || "US",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Save failed.");

      const u = data.user as Profile;

      // Merge returned user onto current profile (even if API only returns partial)
      const merged = { ...(profile ?? ({} as any)), ...u } as Profile;

      setProfile(merged);
      setBirthday(toDateInputValue(merged?.birthday));
      setOk("Saved.");
    } catch (e: any) {
      setErr(e?.message || "Save failed.");
    } finally {
      setSaving(false);
      setTimeout(() => setOk(null), 2500);
    }
  }

  return (
    <form onSubmit={onSave} className="mt-5 space-y-4">
      {loading ? (
        <div className="text-sm text-white/60">Loading profile…</div>
      ) : err ? (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <label className="text-xs uppercase tracking-wide text-white/60">
            Email
          </label>
          <div className="mt-1 text-white">{profile?.email ?? "—"}</div>
          <div className="mt-1 text-xs text-white/45">
            Email is used for login and receipts.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <label className="text-xs uppercase tracking-wide text-white/60">
            Display name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-white outline-none placeholder:text-white/35 focus:border-[#F5D77A]/40"
          />
          <div className="mt-1 text-xs text-white/45">
            Shown in your account.
          </div>
        </div>

        {/* ✅ Birthday (Leaflyx styled picker on desktop) */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs uppercase tracking-wide text-white/60">
              Birthday
            </label>
            <div className="text-xs text-white/45">Used for age verification.</div>
          </div>

          <BirthdayPicker
            value={birthday}
            onChange={(v) => {
              const normalized = normalizeBirthdayInput(v);
              setBirthday(normalized);
              setBirthdayHint(
                v && !normalized
                  ? "Use YYYY-MM-DD (or pick from the calendar)."
                  : null
              );
            }}
            disabled={loading || saving}
          />

          {birthdayHint ? (
            <div className="mt-2 text-xs text-red-200/90">{birthdayHint}</div>
          ) : (
            <div className="mt-2 text-xs text-white/45">
              We store this as a date only (no time).
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs uppercase tracking-wide text-white/60">
              Public handle
            </label>
            <div className="text-xs text-white/50">
              Preview:{" "}
              <span className="text-white/80">
                {normalizedHandle ? `@${normalizedHandle}` : "—"}
              </span>
            </div>
          </div>

          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="leaflyx"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-white outline-none placeholder:text-white/35 focus:border-[#F5D77A]/40"
          />

          <div className="mt-2 text-xs text-white/45">
            Letters/numbers plus <span className="text-white/70">._-</span> only.
            3–24 chars.
          </div>
        </div>
      </div>

      {/* ✅ PRIVATE Shipping Address Section */}
      <section
        id="address"
        className="rounded-2xl border border-[#F5D77A]/20 bg-black/25 p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Shipping address</h2>
              <span className="rounded-full border border-[#F5D77A]/25 bg-[#F5D77A]/10 px-2 py-0.5 text-[11px] text-[#F5D77A]/90">
                Private
              </span>
            </div>
            <p className="mt-1 text-xs text-white/55">
              Never shown on public profiles and never indexed.
            </p>
          </div>

          {hasAddressOnFile ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
              Address on file
            </span>
          ) : (
            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-200">
              No address on file
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-wide text-white/60">
              Address 1
            </label>
            <input
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="Street address"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-white outline-none placeholder:text-white/35 focus:border-[#F5D77A]/40"
              autoComplete="shipping address-line1"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-wide text-white/60">
              Address 2
            </label>
            <input
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="Apt / Suite (optional)"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-white outline-none placeholder:text-white/35 focus:border-[#F5D77A]/40"
              autoComplete="shipping address-line2"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-white/60">
              City
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-white outline-none placeholder:text-white/35 focus:border-[#F5D77A]/40"
              autoComplete="shipping address-level2"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-white/60">
              State
            </label>
            <input
              value={stateProv}
              onChange={(e) => setStateProv(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-white outline-none placeholder:text-white/35 focus:border-[#F5D77A]/40"
              autoComplete="shipping address-level1"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-white/60">
              ZIP / Postal
            </label>
            <input
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-white outline-none placeholder:text-white/35 focus:border-[#F5D77A]/40"
              autoComplete="shipping postal-code"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-white/60">
              Country
            </label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="US"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-white outline-none placeholder:text-white/35 focus:border-[#F5D77A]/40"
              autoComplete="shipping country"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-wide text-white/60">
              Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(optional)"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-white outline-none placeholder:text-white/35 focus:border-[#F5D77A]/40"
              autoComplete="tel"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
  type="submit"
  disabled={loading || saving}
  className="
    rounded-xl
    bg-[var(--brand-gold)]
    px-5 py-2
    font-medium text-black
    transition
    hover:bg-[var(--brand-gold)]
    hover:shadow-[0_0_28px_rgba(212,175,55,0.45)]
    disabled:opacity-60
  "
>
  {saving ? "Saving…" : "Save changes"}
</button>


        {ok ? (
          <div className="text-sm text-[#F5D77A]">{ok}</div>
        ) : hasUnsaved ? (
          <div className="text-sm text-white/50">Unsaved changes</div>
        ) : null}
      </div>
    </form>
  );
}
