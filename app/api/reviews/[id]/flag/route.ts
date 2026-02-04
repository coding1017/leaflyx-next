import { NextResponse } from "next/server";
// from app/api/reviews/[id]/flag/route.ts up to project root = 5 levels
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

// POST /api/reviews/123/flag
// body: { reason?: string, details?: string }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const payload = await req.json().catch(() => ({}));
    const reason = String(payload?.reason || "other").slice(0, 60);
    const details = String(payload?.details || "").slice(0, 500);

    await prisma.reviewFlag.create({ data: { reviewId: id, reason, details } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // e.code examples: P2003 (FK), P2025 (not found), P2002 (unique), etc.
    console.error("FLAG ERROR:", e?.code, e?.message);
    return NextResponse.json(
      { error: "Server error", code: e?.code, detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
