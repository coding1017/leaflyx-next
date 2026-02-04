// app/account/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import ReorderButton from "@/components/account/ReorderButton";

function initialsFrom(name: string | null | undefined, email: string) {
  const base = (name || "").trim();
  if (base) {
    const parts = base.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
    const out = (a + b).toUpperCase();
    return out || email.slice(0, 2).toUpperCase();
  }
  const e = (email || "").trim();
  if (!e) return "LX";
  return e.split("@")[0].slice(0, 2).toUpperCase();
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

function formatDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function usdFromCents(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      cents / 100
    );
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");

  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    email: true,
    name: true,
    role: true,
    handle: true,
    publicProfileEnabled: true,
    updatedAt: true,

    // address (private)
    address1: true,
    city: true,
    state: true,
    postal: true,
    country: true, // ✅ ADD THIS
  },
});



  if (!user) redirect("/sign-in");

  // ✅ last order summary (real schema)
  const lastOrder = await prisma.order.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const lastOrderItemCount = lastOrder
    ? lastOrder.items.reduce((s, it) => s + it.qty, 0)
    : 0;

  const hasSavedAddress =
    Boolean(user.address1?.trim()) &&
    Boolean(user.city?.trim()) &&
    Boolean(user.state?.trim()) &&
    Boolean(user.postal?.trim()) &&
    Boolean(user.country?.trim());

  const initials = initialsFrom(user.name, user.email);

  return (
    <div className="relative min-w-0 text-white">
      {/* Tiny seal watermark (bottom-left of CONTENT area, not the whole page) */}
      <div className="pointer-events-none absolute left-0 bottom-0 opacity-[0.10]">
        <div className="h-14 w-14 rounded-full border border-[#F5D77A]/25 bg-black/20 backdrop-blur">
          <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="rgba(245,215,122,0.55)"
              strokeWidth="2"
            />
            <circle
              cx="32"
              cy="32"
              r="20"
              fill="none"
              stroke="rgba(245,215,122,0.28)"
              strokeWidth="2"
              strokeDasharray="2 3"
            />
            <path
              d="M20 36c6 6 18 6 24 0"
              fill="none"
              stroke="rgba(245,215,122,0.55)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M24 28c2-6 14-6 16 0"
              fill="none"
              stroke="rgba(245,215,122,0.55)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <text
              x="32"
              y="50"
              textAnchor="middle"
              fontSize="8"
              fill="rgba(245,215,122,0.7)"
              fontFamily="ui-sans-serif, system-ui"
              letterSpacing="1.5"
            >
              LEAFLYX
            </text>
          </svg>
        </div>
      </div>

      {/* Content header row (avatar + actions) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar w/ gold ring */}
          <div className="relative shrink-0">
            <div className="absolute -inset-[2px] rounded-full bg-gradient-to-b from-[#F5D77A]/70 via-[#F5D77A]/30 to-transparent blur-[0.6px]" />
            <div className="relative grid h-14 w-14 place-items-center rounded-full border border-[#F5D77A]/35 bg-black/40 text-lg font-semibold text-[#F5D77A] shadow-[0_0_22px_rgba(245,215,122,0.12)]">
              {initials}
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold text-white">
              {(user.name?.trim() || "") || "Account overview"}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
              <span className="max-w-full rounded-full border border-white/10 bg-black/25 px-3 py-1">
                {user.email}
              </span>

              {user.role === "ADMIN" ? (
                <span className="rounded-full border border-[#F5D77A]/25 bg-[#F5D77A]/10 px-3 py-1 text-[#F5D77A]/90">
                  Admin
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">
                  Member
                </span>
              )}

              {/* ✅ Saved address indicator */}
             <Link
  href="/account/edit#address"
  className="
    group inline-flex items-center gap-3
    rounded-full border border-[#F5D77A]/40
    bg-[#F5D77A]/10 px-5 py-2
    text-sm font-medium text-[#F5D77A]
    transition
    hover:bg-[#F5D77A]/15
    hover:shadow-[0_0_22px_rgba(245,215,122,0.35)]
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5D77A]/60
  "
  title={
    hasSavedAddress
      ? "Edit your saved shipping address"
      : "Add a shipping address"
  }
>
  {/* Icon */}
  <span className="text-lg leading-none">
    {hasSavedAddress ? "📍" : "⚠️"}
  </span>

  {/* Text */}
  <span>
    {hasSavedAddress
      ? "Shipping address on file"
      : "No shipping address on file"}
  </span>

  {/* Action cue */}
  <span className="ml-1 underline underline-offset-4 group-hover:opacity-100 opacity-80">
    {hasSavedAddress ? "Edit →" : "Add →"}
  </span>
</Link>


            </div>
          </div>
        </div>

        {/* Actions (keep here; layout already has logout in top bar) */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/account/settings"
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-[var(--brand-gold)] hover:bg-black/55"
          >
            Settings
          </Link>

          {user.role === "ADMIN" ? (
  <Link
    href="/admin"
    className="rounded-xl bg-[var(--brand-gold)] px-4 py-2 font-medium text-black transition hover:shadow"
  >
    Admin
  </Link>
) : null}
        </div>
      </div>

      {/* Cards */}
      <div className="mt-6 space-y-6">
        {/* ✅ NEW: Last order summary */}
        <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Last order</h2>
              <div className="mt-2 h-px w-24 bg-gradient-to-r from-[#F5D77A]/60 to-transparent" />
              <p className="mt-2 text-white/70 text-sm">
                Quick summary + reorder.
              </p>
            </div>

            {lastOrder ? <ReorderButton orderId={lastOrder.id} /> : null}
          </div>

          {!lastOrder ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-white/80 font-medium">No orders yet</div>
              <div className="mt-1 text-sm text-white/60">
                When you place an order, it’ll show up here for one-click reorders.
              </div>
              <div className="mt-4">
                <Link
  href="/products"
  className="inline-flex rounded-xl bg-[var(--brand-gold)] px-4 py-2 font-medium text-black transition hover:shadow-[0_0_28px_rgba(212,175,55,0.45)]"
>
  Shop
</Link>

              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/60">Placed</div>
                <div className="text-white">{formatDateTime(lastOrder.createdAt)}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/60">Total</div>
                <div className="text-white">
                  {usdFromCents(lastOrder.totalCents, lastOrder.currency)}
                </div>
                <div className="mt-1 text-xs text-white/50">
                  {lastOrderItemCount} item{lastOrderItemCount === 1 ? "" : "s"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/60">Status</div>
                <div className="text-white">{lastOrder.status}</div>
                <div className="mt-1 text-xs text-white/50">
                  Updated {formatDate(lastOrder.updatedAt)}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Profile */}
        <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <div className="mt-2 h-px w-24 bg-gradient-to-r from-[#F5D77A]/60 to-transparent" />
          <p className="mt-2 text-white/70 text-sm">Update contact info and settings.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs text-white/60">Email</div>
              <div className="break-all text-white">{user.email}</div>
            </div>

            <div className="min-w-0 rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs text-white/60">Public handle</div>
              <div className="break-words text-white">
                {user.handle || "— (set one if you want a public profile)"}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
  href="/account/edit"
  className="rounded-xl bg-[var(--brand-gold)] px-5 py-2 font-medium text-black transition hover:shadow-[0_0_28px_rgba(212,175,55,0.45)]"
>
  Edit profile
</Link>

            {user.publicProfileEnabled && user.handle ? (
              <Link
                href={`/profile/${user.handle}`}
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white/90 hover:bg-black/55"
              >
                View public profile
              </Link>
            ) : null}
          </div>
        </section>

        {/* Security */}
        <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <h2 className="text-lg font-semibold text-white">Security</h2>
          <div className="mt-2 h-px w-24 bg-gradient-to-r from-[#F5D77A]/60 to-transparent" />
          <p className="mt-2 text-white/70 text-sm">
            Passwords are hashed. We never store or email your plaintext password.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs text-white/60">Password last changed</div>
              <div className="text-white">{formatDate(user.updatedAt)}</div>
              <div className="mt-2 text-xs text-white/50">(Placeholder.)</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs text-white/60">Two-factor authentication</div>
              <div className="text-white">Coming soon</div>
              <div className="mt-2 text-xs text-white/50">
                Placeholder — we’ll wire this when you’re ready.
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Link
              href="/forgot-password"
              className="inline-flex rounded-xl border border-[#F5D77A]/20 bg-black/35 px-4 py-2 text-[var(--brand-gold)] hover:bg-black/50"
            >
              Reset password
            </Link>
          </div>
        </section>

        {/* Orders */}
        <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <h2 className="text-lg font-semibold text-white">Orders</h2>
          <div className="mt-2 h-px w-24 bg-gradient-to-r from-[#F5D77A]/60 to-transparent" />
          <p className="mt-2 text-white/70 text-sm">Order history is always private.</p>

          <Link
            href="/account/orders"
            className="mt-4 inline-flex rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-[var(--brand-gold)] hover:bg-black/55"
          >
            View orders
          </Link>
        </section>
      </div>
    </div>
  );
}
