// app/api/admin/reviews/route.ts
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { ReviewStatus } from "@prisma/client";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

function toHttpStatus(e: any) {
  const msg = String(e?.message || "");
  if (msg === "UNAUTHORIZED") return 401;
  if (msg === "FORBIDDEN") return 403;
  return 500;
}

export async function GET(req: Request) {
  try {
    await assertAdmin();

    const { searchParams } = new URL(req.url);
    const raw = (searchParams.get("status") || "PENDING").toUpperCase();

    const allowed = new Set<"PENDING" | "APPROVED" | "REJECTED" | "ALL">([
      "PENDING",
      "APPROVED",
      "REJECTED",
      "ALL",
    ]);

    const status = (allowed.has(raw as any) ? raw : "PENDING") as
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | "ALL";

    const where = status === "ALL" ? {} : { status: status as ReviewStatus };

    const items = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    const status = toHttpStatus(e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status }
    );
  }
}
