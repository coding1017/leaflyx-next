// app/admin/discounts/page.tsx
import DiscountsAdminClient from "./ui";

export default function AdminDiscountsPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-semibold">Discount Codes</h1>
        <p className="mt-1 text-white/60">
          Create codes, adjust discounts (max 50%), and track usage.
        </p>
      </div>

      <DiscountsAdminClient />
    </div>
  );
}
