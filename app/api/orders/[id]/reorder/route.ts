import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  // Return items in the shape your CartContext expects
  const items = order.items.map((it) => ({
    id: it.productId,
    name: it.name,
    variant: it.variant ?? null,
    priceCents: it.priceCents,
    qty: it.qty,
    // image is optional; we’ll fill this client-side from your catalog if you want
  }));

  return NextResponse.json({ ok: true, items });
}
