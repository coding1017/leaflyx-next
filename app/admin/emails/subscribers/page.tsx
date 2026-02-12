import SubscribersClient from "@/components/admin/emails/SubscribersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminSubscribersPage() {
  return <SubscribersClient />;
}
