import Link from "next/link";

export const metadata = {
  title: "Unsubscribed — Leaflyx",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams?: { token?: string };
};

export default function UnsubscribeSuccessPage({ searchParams }: Props) {
  const token = String(searchParams?.token ?? "").trim();

  return (
    <main className="mx-auto max-w-5xl px-6 py-14 text-white">
      <div
        className="
          mx-auto w-full max-w-2xl
          rounded-3xl border-[3px] border-[var(--brand-gold)]
          bg-black
          shadow-[0_0_0_1px_rgba(212,175,55,0.25),_0_30px_90px_rgba(0,0,0,0.70)]
          overflow-hidden
          relative
        "
      >
        {/* subtle gold sheen */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_20%_-10%,rgba(212,175,55,0.18),transparent_60%)]" />

        <div className="relative p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--brand-gold)] drop-shadow-[0_0_18px_rgba(212,175,55,0.35)]">
            You’re unsubscribed
          </h1>

          <p className="mt-4 text-white/80 leading-relaxed">
            You won’t receive promotional emails from Leaflyx. If you change your mind,
            you can re-subscribe anytime from the cart notice.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <div className="text-sm text-white/70">
              <span className="text-[var(--brand-gold)] font-semibold">Changed your mind?</span>{" "}
              Re-subscribe anytime.
            </div>

            <div className="flex flex-wrap gap-3">
              {/* REAL resubscribe */}
              {token ? (
                <Link
                  href={`/api/subscribe/resubscribe?token=${encodeURIComponent(token)}`}
                  className="
                    inline-flex items-center justify-center
                    rounded-full px-5 py-2.5 text-sm font-semibold
                    bg-[var(--brand-gold)] text-black
                    hover:brightness-105
                    shadow-[0_0_0_2px_rgba(212,175,55,0.25),_0_0_26px_rgba(212,175,55,0.55),_0_18px_60px_rgba(212,175,55,0.20)]
                    transition
                  "
                >
                  Re-subscribe
                </Link>
              ) : (
                <button
                  disabled
                  className="
                    inline-flex items-center justify-center
                    rounded-full px-5 py-2.5 text-sm font-semibold
                    bg-[var(--brand-gold)] text-black
                    opacity-50 cursor-not-allowed
                  "
                  title="Missing token"
                >
                  Re-subscribe
                </button>
              )}

              <Link
                href="/products"
                className="
                  inline-flex items-center justify-center
                  rounded-full px-5 py-2.5 text-sm font-semibold
                  border-2 border-[var(--brand-gold)]
                  bg-black/30
                  hover:bg-black/45
                  transition
                "
              >
                Back to shop
              </Link>
            </div>

            {!token ? (
              <div className="mt-2 text-xs text-white/60">
                Missing token. If you used an old unsubscribe link, try again from the latest email.
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative border-t-[3px] border-[var(--brand-gold)] px-6 py-3 text-xs text-white/60">
          Leaflyx • Premium THCA goods
        </div>
      </div>
    </main>
  );
}
