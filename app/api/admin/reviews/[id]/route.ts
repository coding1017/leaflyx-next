// app/api/admin/reviews/[id]/route.ts
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 0;

function toHttpStatus(e: any) {
  const msg = String(e?.message || "");
  if (msg === "UNAUTHORIZED") return 401;
  if (msg === "FORBIDDEN") return 403;
  return 500;
}

// POST /api/admin/reviews/123  body: { action: "APPROVE" | "REJECT" }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();

    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const { action } = (await req.json().catch(() => ({ action: "" }))) as { action?: string };
    const A = String(action || "").toUpperCase();
    if (!["APPROVE", "REJECT"].includes(A)) {
      return NextResponse.json({ error: "Action must be APPROVE or REJECT" }, { status: 400 });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { status: A === "APPROVE" ? "APPROVED" : "REJECTED" },
    });

    return NextResponse.json({ ok: true, review });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: toHttpStatus(e) });
  }
}
