// app/api/admin/discounts/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin-guard";

function numOrUndef(v: any) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();

    const id = params.id;
    const body = await req.json();

    // Build partial update safely (only apply provided fields)
    const data: any = {};

    if (body.description !== undefined) data.description = body.description ?? null;
    if (body.ambassadorLabel !== undefined) data.ambassadorLabel = body.ambassadorLabel ?? null;

    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    // Optional limits
    if (body.minSubtotalCents !== undefined) {
      const v = numOrUndef(body.minSubtotalCents);
      data.minSubtotalCents = v === null ? null : v;
    }

    if (body.maxUses !== undefined) {
      const v = numOrUndef(body.maxUses);
      data.maxUses = v === null ? null : v;
    }

    if (body.expiresAt !== undefined) {
      data.expiresAt =
        body.expiresAt === null
          ? null
          : body.expiresAt
          ? new Date(body.expiresAt)
          : null;
    }

    // Type + value updates:
    // - Only change type if explicitly passed
    // - Only change percent/amount if explicitly passed
    if (body.type !== undefined) {
      const type = body.type === "AMOUNT" ? "AMOUNT" : "PERCENT";
      data.type = type;

      // If switching types, we usually want the opposite field nulled for cleanliness
      if (type === "PERCENT") data.amountOffCents = null;
      if (type === "AMOUNT") data.percentOff = null;
    }

    if (body.percentOff !== undefined) {
      const n = Number(body.percentOff);
      if (!Number.isFinite(n)) {
        return NextResponse.json({ ok: false, error: "Invalid percentOff" }, { status: 400 });
      }
      data.percentOff = Math.max(1, Math.min(50, n)); // ✅ hard cap
      // If they set percentOff, ensure type is percent
      data.type = "PERCENT";
      data.amountOffCents = null;
    }

    if (body.amountOffCents !== undefined) {
      const n = Number(body.amountOffCents);
      if (!Number.isFinite(n) || n < 1) {
        return NextResponse.json({ ok: false, error: "Invalid amountOffCents" }, { status: 400 });
      }
      data.amountOffCents = Math.floor(n);
      // If they set amountOffCents, ensure type is amount
      data.type = "AMOUNT";
      data.percentOff = null;
    }

    // Nothing to update?
    if (!Object.keys(data).length) {
      const existing = await prisma.discountCode.findUnique({ where: { id } });
      return NextResponse.json({ ok: true, code: existing });
    }

    const updated = await prisma.discountCode.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true, code: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();
    await prisma.discountCode.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
