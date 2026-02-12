import Link from "next/link";

const TABS = [
  {
    key: "restock",
    title: "Restock",
    desc: "View pending restock requests, filter by product/variant, and delete stale rows.",
  },
  {
    key: "password",
    title: "Password resets",
    desc: "Manage reset tokens/requests (coming next).",
  },
  {
    key: "subscribers",
    title: "Subscribers",
    desc: "Newsletter/marketing list (coming next).",
  },
] as const;

export default function AdminEmailsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Emails</h1>
        <p className="mt-2 text-white/70">
          Manage email-related queues: restock, password resets, subscribers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {TABS.map((t) => (
          <div
            key={t.key}
            className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          >
            <div className="text-2xl font-semibold">{t.title}</div>
            <div className="mt-2 text-sm text-white/60">{t.desc}</div>

            <Link
              href={`/admin/emails/${t.key}`}
              className="mt-4 inline-flex text-[var(--brand-gold)] underline underline-offset-4 hover:opacity-90"
            >
              Open
            </Link>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/55">
        Add more email sections later by extending the Emails routes under{" "}
        <code className="text-white/70">app/admin/emails/*</code>.
      </div>
    </div>
  );
}
