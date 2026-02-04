// app/admin/page.tsx
import Link from "next/link";

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="
        rounded-3xl border border-[var(--brand-gold)]/25
        bg-black/25 backdrop-blur-md
        p-6 block
        hover:border-[var(--brand-gold)]/50 hover:bg-black/35
        transition
      "
    >
      <div className="text-xl font-semibold">{title}</div>
      <div className="mt-2 text-sm text-white/60">{desc}</div>
      <div className="mt-4 text-sm">
        <span className="text-[var(--brand-gold)] underline underline-offset-4">
          Open
        </span>
      </div>
    </Link>
  );
}

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-white/60">
          Manage Leaflyx operations: inventory, reviews, and discount codes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="Inventory"
          desc="Adjust stock by variant, trigger restock alerts, create missing rows."
          href="/admin/inventory"
        />
        <Card
          title="Reviews"
          desc="Moderate reviews, monitor ratings, handle flags/helpful."
          href="/admin/reviews"
        />
        <Card
          title="Discounts"
          desc="Create ambassador codes, set discount amounts (max 50%), track usage."
          href="/admin/discounts"
        />
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md p-6">
        <div className="text-sm text-white/70">
          Add more admin sections later by extending the <code className="text-white/90">NAV</code>{" "}
          array in <code className="text-white/90">app/admin/shell.tsx</code>.
        </div>
      </div>
    </div>
  );
}
