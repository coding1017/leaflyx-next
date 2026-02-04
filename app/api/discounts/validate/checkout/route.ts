// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clampDiscountCents, type CartItemSnap } from "@/lib/discounts";

// Optional: if you have NextAuth, you can attach user identity.
// If not, leave userId/userEmail null.
// import { auth } from "@/auth"; or getServerSession, etc.

type Body = {
  items: CartItemSnap[];
  subtotalCents: number;
  code?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const items = Array.isArray(body.items) ? body.items : [];
    const subtotalCents = Number(body.subtotalCents ?? 0);
    const code = (body.code ?? "").trim().toUpperCase();

    if (!items.length || subtotalCents <= 0) {
      return NextResponse.json({ ok: false, error: "Cart is empty." }, { status: 400 });
    }

    let discountCents = 0;
    let discountCodeId: string | null = null;

    if (code) {
      const dc = await prisma.discountCode.findUnique({
        where: { code },
        select: {
          id: true,
          code: true,
          isActive: true,
          type: true,
          percentOff: true,
          amountOffCents: true,
          minSubtotalCents: true,
          maxUses: true,
          usesCount: true,
          expiresAt: true,
        },
      });

      if (!dc || !dc.isActive) {
        return NextResponse.json({ ok: false, error: "Invalid discount code." }, { status: 400 });
      }
      if (dc.expiresAt && dc.expiresAt.getTime() < Date.now()) {
        return NextResponse.json({ ok: false, error: "Discount code expired." }, { status: 400 });
      }
      if (dc.maxUses != null && dc.usesCount >= dc.maxUses) {
        return NextResponse.json({ ok: false, error: "Discount code limit reached." }, { status: 400 });
      }

      const res = clampDiscountCents({
        subtotalCents,
        discount: {
          code: dc.code,
          type: dc.type,
          percentOff: dc.percentOff,
          amountOffCents: dc.amountOffCents,
          minSubtotalCents: dc.minSubtotalCents,
        },
      });

      discountCents = res.discountCents;
      discountCodeId = dc.id;

      // ✅ If code exists but yields 0 (min subtotal, etc.), treat as invalid at checkout
      if (discountCents <= 0) {
        return NextResponse.json(
          { ok: false, error: "Discount code does not apply to this cart." },
          { status: 400 }
        );
      }
    }

    const totalCents = Math.max(0, subtotalCents - discountCents);

    // TODO: attach user identity if you have it
    const userId = null;
    const userEmail = null;

    // Track redemption + increment usesCount atomically
    if (discountCodeId) {
      await prisma.$transaction([
        prisma.discountCode.update({
          where: { id: discountCodeId },
          data: { usesCount: { increment: 1 } },
        }),
        prisma.discountRedemption.create({
          data: {
            discountCodeId,
            codeSnapshot: code,
            userId,
            userEmail,
            subtotalCents,
            discountCents,
            totalCents,
            itemsJson: items,
          },
        }),
      ]);
    }

    // If you have a payment provider, you’d create the payment session here and return a redirect URL.
    return NextResponse.json({
      ok: true,
      subtotalCents,
      discountCents,
      totalCents,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Checkout failed." }, { status: 500 });
  }
}
