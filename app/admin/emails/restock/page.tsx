import RestockRequestsClient from "@/components/admin/emails/RestockRequestsClient";

export default function AdminRestockEmailsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-white/60">
          <a
            href="/admin/emails"
            className="text-[var(--brand-gold)] underline underline-offset-4 hover:opacity-90"
          >
            Emails
          </a>{" "}
          <span className="text-white/40">/</span> Restock
        </div>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Restock requests
        </h1>
        <p className="mt-2 text-white/70">
          See pending requests, filter, delete stale rows, and trigger resend.
        </p>
      </div>

      <RestockRequestsClient />
    </div>
  );
}
