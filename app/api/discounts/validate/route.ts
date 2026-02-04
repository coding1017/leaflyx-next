// app/api/discounts/validate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust if your prisma client path differs
import { clampDiscountCents, type CartItemSnap } from "@/lib/discounts";

type Body = {
  code: string;
  subtotalCents: number;
  items: CartItemSnap[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const code = (body.code ?? "").trim().toUpperCase();
    const subtotalCents = Number(body.subtotalCents ?? 0);

    if (!code) {
      return NextResponse.json({ ok: false, error: "Missing code." }, { status: 400 });
    }

    const dc = await prisma.discountCode.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        description: true,
        ambassadorLabel: true,
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
      return NextResponse.json({ ok: false, error: "Invalid code." }, { status: 404 });
    }

    if (dc.expiresAt && dc.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: "This code has expired." }, { status: 400 });
    }

    if (dc.maxUses != null && dc.usesCount >= dc.maxUses) {
      return NextResponse.json({ ok: false, error: "This code has reached its limit." }, { status: 400 });
    }

    const { discountCents, reason } = clampDiscountCents({
      subtotalCents,
      discount: {
        code: dc.code,
        type: dc.type,
        percentOff: dc.percentOff,
        amountOffCents: dc.amountOffCents,
        minSubtotalCents: dc.minSubtotalCents,
      },
    });

    if (discountCents <= 0) {
      const msg =
        reason === "min_subtotal"
          ? "Cart does not meet the minimum subtotal for this code."
          : "This code does not apply to your cart.";
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      code: dc.code,
      description: dc.description,
      ambassadorLabel: dc.ambassadorLabel,
      discountCents,
      // helpful for UI display:
      type: dc.type,
      percentOff: dc.percentOff,
      amountOffCents: dc.amountOffCents,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Server error validating code." }, { status: 500 });
  }
}
