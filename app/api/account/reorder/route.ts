// app/api/account/reorder/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { products } from "@/lib/products";
import type { StaticImageData } from "next/image";

type PI = string | StaticImageData;

function srcOf(img: PI | null | undefined): string | null {
  if (!img) return null;
  return typeof img === "string" ? img : img.src;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { orderId } = (await req.json()) as { orderId?: string };

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: {
      id: true,
      items: {
        select: {
          productId: true,
          name: true,
          variant: true,
          qty: true,
          priceCents: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const items = order.items.map((it) => {
    const p = (products as any[]).find((x) => String(x.id) === String(it.productId));
    const image = srcOf((p as any)?.image ?? (p as any)?.images?.[0] ?? null);
    const slug = (p as any)?.slug ? String((p as any).slug) : null;

    return {
      productId: it.productId,
      name: it.name,
      variant: it.variant ?? null,
      qty: it.qty,
      priceCents: it.priceCents,
      image, // string | null
      slug,  // slug | null (for “View product”)
      href: slug ? `/shop/${slug}` : null, // ✅ canonical
    };
  });

  return NextResponse.json({ items });
}
