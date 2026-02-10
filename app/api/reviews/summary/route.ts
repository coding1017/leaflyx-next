// app/api/reviews/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 0;

function isDbReachabilityError(e: any) {
  const msg = String(e?.message || "");
  return e?.code === "P1001" || msg.includes("Can't reach database server");
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 250): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (retries > 0 && isDbReachabilityError(e)) {
      await new Promise((r) => setTimeout(r, delayMs));
      return withRetry(fn, retries - 1, delayMs);
    }
    throw e;
  }
}

function parseSlugs(searchParams: URLSearchParams): string[] {
  // supports ?slugs=a,b,c  OR  ?slugs=a&slugs=b
  const out = new Set<string>();
  const multi = searchParams.getAll("slugs");
  if (multi.length) {
    for (const m of multi) m.split(",").forEach((s) => s && out.add(s.trim()));
  }
  const single = searchParams.get("slug");
  if (single) out.add(single.trim());
  return Array.from(out).filter(Boolean);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slugs = parseSlugs(searchParams);

    if (!slugs.length) {
      return NextResponse.json({ error: "Missing slugs" }, { status: 400 });
    }

    const rows = await withRetry(() =>
      prisma.review.groupBy({
        by: ["productSlug"],
        // ✅ Only APPROVED should be shown publicly
        where: { productSlug: { in: slugs }, status: "APPROVED" as const },
        _count: { _all: true },
        _avg: { rating: true },
      })
    );

    const data: Record<string, { count: number; average: number }> = {};
    for (const s of slugs) data[s] = { count: 0, average: 0 };

    for (const r of rows) {
      data[r.productSlug] = {
        count: r._count._all,
        average: Number((r._avg.rating ?? 0).toFixed(2)),
      };
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    if (isDbReachabilityError(e)) {
      // return safe response so UI doesn’t flicker/hard-fail
      return NextResponse.json({ ok: true, data: {}, degraded: true }, { status: 200 });
    }
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
