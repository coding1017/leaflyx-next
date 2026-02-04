// app/api/reviews/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 0;

function parseSlugs(searchParams: URLSearchParams): string[] {
  // supports ?slugs=a,b,c  OR  ?slugs=a&slugs=b
  const out = new Set<string>();
  const multi = searchParams.getAll("slugs");
  if (multi.length) {
    for (const m of multi) m.split(",").forEach(s => s && out.add(s.trim()));
  }
  const single = searchParams.get("slug");
  if (single) out.add(single.trim());
  return Array.from(out).filter(Boolean);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slugs = parseSlugs(searchParams);

  if (!slugs.length) {
    return NextResponse.json({ error: "Missing slugs" }, { status: 400 });
  }

  const rows = await prisma.review.groupBy({
    by: ["productSlug"],
    where: { productSlug: { in: slugs } },
    _count: { _all: true },
    _avg: { rating: true },
  });

  const data: Record<string, { count: number; average: number }> = {};
  for (const s of slugs) data[s] = { count: 0, average: 0 };
  for (const r of rows) {
    data[r.productSlug] = {
      count: r._count._all,
      average: Number((r._avg.rating ?? 0).toFixed(2)),
    };
  }

  return NextResponse.json({ ok: true, data });
}
