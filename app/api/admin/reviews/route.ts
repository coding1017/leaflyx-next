import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "../../../../lib/prisma";     // <- relative path
import { ReviewStatus } from "@prisma/client";       // <- enum for type-safety

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

function assertAdmin() {
  const got = headers().get("x-admin-token") || "";
  if (!process.env.ADMIN_TOKEN || got !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const unauthorized = assertAdmin();
    if (unauthorized) return unauthorized;

    const { searchParams } = new URL(req.url);
    const raw = (searchParams.get("status") || "PENDING").toUpperCase();

    // Guard allowed statuses; fall back to PENDING
    const allowed = new Set<"PENDING" | "APPROVED" | "REJECTED" | "ALL">(
      ["PENDING", "APPROVED", "REJECTED", "ALL"]
    );
    const status = (allowed.has(raw as any) ? raw : "PENDING") as
      "PENDING" | "APPROVED" | "REJECTED" | "ALL";

    const where = status === "ALL" ? {} : { status: status as ReviewStatus };

    const items = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error("ADMIN LIST ERROR:", err);
    return NextResponse.json(
      { error: "Server error", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
