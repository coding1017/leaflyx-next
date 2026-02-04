// app/api/admin/discounts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin-guard";

export async function GET() {
  try {
    await assertAdmin();

    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, codes });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await assertAdmin();

    const body = await req.json();

    const code = String(body.code ?? "").trim().toUpperCase();
    if (!code) return NextResponse.json({ ok: false, error: "Missing code." }, { status: 400 });

    const type = body.type === "AMOUNT" ? "AMOUNT" : "PERCENT";

    // ✅ Safety: never store > 50% percentOff
    const percentOff =
      type === "PERCENT" ? Math.max(1, Math.min(50, Number(body.percentOff ?? 0))) : null;

    const amountOffCents =
      type === "AMOUNT" ? Math.max(1, Number(body.amountOffCents ?? 0)) : null;

    const dc = await prisma.discountCode.create({
      data: {
        code,
        description: body.description ?? null,
        ambassadorLabel: body.ambassadorLabel ?? null,
        isActive: Boolean(body.isActive ?? true),
        type,
        percentOff,
        amountOffCents,
        minSubtotalCents: body.minSubtotalCents != null ? Number(body.minSubtotalCents) : null,
        maxUses: body.maxUses != null ? Number(body.maxUses) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    return NextResponse.json({ ok: true, code: dc });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "Create failed." }, { status: 400 });
  }
}
