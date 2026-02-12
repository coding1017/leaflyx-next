// app/admin/emails/password/page.tsx
import PasswordResetsClient from "@/components/admin/emails/PasswordResetsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminPasswordResetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-white/60">Emails / Password resets</div>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">Password resets</h1>
        <p className="mt-2 text-white/70">
          View tokens, clean up stale ones, and send new reset links.
        </p>
      </div>

      <PasswordResetsClient />
    </div>
  );
}
