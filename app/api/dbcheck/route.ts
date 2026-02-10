// app/api/dbcheck/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 0;

function safeDbHost() {
  try {
    const u = process.env.DATABASE_URL || "";
    if (!u) return null;
    return new URL(u).host; // safe to show host only
  } catch {
    return "invalid-url";
  }
}

export async function GET() {
  try {
    const count = await prisma.review.count();

    return NextResponse.json({
      ok: true,
      reviewCount: count,
      dbHost: safeDbHost(),
      hasDATABASE_URL: !!process.env.DATABASE_URL,
      hasDIRECT_URL: !!process.env.DIRECT_URL,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || String(e),
        dbHost: safeDbHost(),
        hasDATABASE_URL: !!process.env.DATABASE_URL,
        hasDIRECT_URL: !!process.env.DIRECT_URL,
      },
      { status: 500 }
    );
  }
}
