// app/account/orders/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReorderButton from "@/components/account/ReorderButton";

function formatWhen(d: Date) {
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

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 text-white">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <p className="mt-2 text-white/70">Private history + quick reorders.</p>

      <div className="mt-6 space-y-3">
        {orders.length === 0 ? (
          <div className="text-white/70">No orders yet.</div>
        ) : (
          orders.map((o) => {
            const itemCount = o.items.reduce((s, it) => s + it.qty, 0);
            return (
              <div
                key={o.id}
                className="rounded-2xl border border-white/10 bg-black/35 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-medium">
                      Order #{o.id.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-white/60 text-sm">
                      {formatWhen(o.createdAt)} • {o.status} •{" "}
                      {usdFromCents(o.totalCents, o.currency)} • {itemCount} item
                      {itemCount === 1 ? "" : "s"}
                    </div>
                  </div>

                  <ReorderButton orderId={o.id} />
                </div>

                <div className="mt-3 text-sm text-white/70">
                  {o.items.slice(0, 4).map((it) => (
                    <div key={it.id}>
                      {it.qty}× {it.name} {it.variant ? `(${it.variant})` : ""}
                    </div>
                  ))}
                  {o.items.length > 4 ? (
                    <div>…and {o.items.length - 4} more</div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
