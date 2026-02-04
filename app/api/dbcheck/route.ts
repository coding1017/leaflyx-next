// app/api/dbcheck/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";   // ensure Node runtime for Prisma
export const revalidate = 0;       // disable caching

export async function GET() {
  try {
    const count = await prisma.review.count();
    return NextResponse.json({ ok: true, reviewCount: count });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
