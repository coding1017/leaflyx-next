// app/api/admin/discounts/route.ts
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function toHttpStatus(e: any) {
  const msg = String(e?.message || "");
  if (msg === "UNAUTHORIZED") return 401;
  if (msg === "FORBIDDEN") return 403;
  return 500;
}

export async function GET() {
  try {
    await assertAdmin();

    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, codes });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Forbidden" }, { status: toHttpStatus(e) });
  }
}

export async function POST(req: Request) {
  try {
    await assertAdmin();

    const body = await req.json().catch(() => ({}));

    const code = String((body as any).code ?? "").trim().toUpperCase();
    if (!code) return NextResponse.json({ ok: false, error: "Missing code." }, { status: 400 });

    const type = (body as any).type === "AMOUNT" ? "AMOUNT" : "PERCENT";

    // ✅ Safety: never store > 50% percentOff
    const percentOff =
      type === "PERCENT" ? Math.max(1, Math.min(50, Number((body as any).percentOff ?? 0))) : null;

    const amountOffCents =
      type === "AMOUNT" ? Math.max(1, Number((body as any).amountOffCents ?? 0)) : null;

    const dc = await prisma.discountCode.create({
      data: {
        code,
        description: (body as any).description ?? null,
        ambassadorLabel: (body as any).ambassadorLabel ?? null,
        isActive: Boolean((body as any).isActive ?? true),
        type,
        percentOff,
        amountOffCents,
        minSubtotalCents: (body as any).minSubtotalCents != null ? Number((body as any).minSubtotalCents) : null,
        maxUses: (body as any).maxUses != null ? Number((body as any).maxUses) : null,
        expiresAt: (body as any).expiresAt ? new Date((body as any).expiresAt) : null,
      },
    });

    return NextResponse.json({ ok: true, code: dc });
  } catch (e: any) {
    const status = toHttpStatus(e);
    const msg = String(e?.message || "");
    // Keep your existing "Create failed" vibe for non-auth errors
    return NextResponse.json({ ok: false, error: status >= 500 ? "Create failed." : msg || "Create failed." }, { status });
  }
}
