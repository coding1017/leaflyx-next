// app/api/admin/discounts/[id]/route.ts
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

function numOrUndef(v: any) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();

    const id = params.id;
    const body = await req.json().catch(() => ({}));

    const data: any = {};

    if ((body as any).description !== undefined) data.description = (body as any).description ?? null;
    if ((body as any).ambassadorLabel !== undefined) data.ambassadorLabel = (body as any).ambassadorLabel ?? null;

    if ((body as any).isActive !== undefined) data.isActive = Boolean((body as any).isActive);

    if ((body as any).minSubtotalCents !== undefined) {
      const v = numOrUndef((body as any).minSubtotalCents);
      data.minSubtotalCents = v === null ? null : v;
    }

    if ((body as any).maxUses !== undefined) {
      const v = numOrUndef((body as any).maxUses);
      data.maxUses = v === null ? null : v;
    }

    if ((body as any).expiresAt !== undefined) {
      data.expiresAt =
        (body as any).expiresAt === null
          ? null
          : (body as any).expiresAt
          ? new Date((body as any).expiresAt)
          : null;
    }

    if ((body as any).type !== undefined) {
      const type = (body as any).type === "AMOUNT" ? "AMOUNT" : "PERCENT";
      data.type = type;
      if (type === "PERCENT") data.amountOffCents = null;
      if (type === "AMOUNT") data.percentOff = null;
    }

    if ((body as any).percentOff !== undefined) {
      const n = Number((body as any).percentOff);
      if (!Number.isFinite(n)) {
        return NextResponse.json({ ok: false, error: "Invalid percentOff" }, { status: 400 });
      }
      data.percentOff = Math.max(1, Math.min(50, n));
      data.type = "PERCENT";
      data.amountOffCents = null;
    }

    if ((body as any).amountOffCents !== undefined) {
      const n = Number((body as any).amountOffCents);
      if (!Number.isFinite(n) || n < 1) {
        return NextResponse.json({ ok: false, error: "Invalid amountOffCents" }, { status: 400 });
      }
      data.amountOffCents = Math.floor(n);
      data.type = "AMOUNT";
      data.percentOff = null;
    }

    if (!Object.keys(data).length) {
      const existing = await prisma.discountCode.findUnique({ where: { id } });
      return NextResponse.json({ ok: true, code: existing });
    }

    const updated = await prisma.discountCode.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true, code: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Forbidden" }, { status: toHttpStatus(e) });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();
    await prisma.discountCode.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Forbidden" }, { status: toHttpStatus(e) });
  }
}
