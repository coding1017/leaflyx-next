// app/api/reviews/[id]/helpful/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  try {
    const updated = await prisma.review.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true, helpfulCount: updated.helpfulCount });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Update failed" },
      { status: 500 }
    );
  }
}
