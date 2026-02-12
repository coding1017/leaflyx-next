import PasswordResetsClient from "@/components/admin/emails/PasswordResetsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminPasswordResetsPage() {
  return <PasswordResetsClient />;
}
