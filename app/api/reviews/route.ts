// app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // if your alias isn't set, use: ../../../../lib/prisma

export const runtime = "nodejs";
export const revalidate = 0;

const BAD_WORDS = ["shit", "fuck", "bitch", "asshole"]; // tiny demo list
const hasProfanity = (s: string) =>
  BAD_WORDS.some((w) => s?.toLowerCase().includes(w));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim();
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const perPage = Math.min(20, Math.max(1, Number(searchParams.get("perPage") || "10")));
  const sort = (searchParams.get("sort") || "recent") as "recent" | "highest" | "lowest" | "helpful";

  let orderBy:
    | { createdAt: "desc" | "asc" }
    | { rating: "desc" | "asc" }
    | { helpfulCount: "desc" } = { createdAt: "desc" };
  if (sort === "highest") orderBy = { rating: "desc" };
  if (sort === "lowest") orderBy = { rating: "asc" };
  if (sort === "helpful") orderBy = { helpfulCount: "desc" };

  // 👇 Only approved reviews are public
  const where = { productSlug: slug, status: "APPROVED" as const };

  const [total, items, grouped, avg] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({ where, orderBy, take: perPage, skip: (page - 1) * perPage }),
    prisma.review.groupBy({ by: ["rating"], _count: { rating: true }, where }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
  ]);

  const histogram: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const g of grouped) histogram[g.rating] = g._count.rating;

  return NextResponse.json({
    total,
    items,
    histogram,
    average: Number((avg._avg.rating || 0).toFixed(2)),
    page,
    perPage,
  });
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim();
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  let data: any;
  try { data = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // honeypot + too-fast
  if (data.website) return NextResponse.json({ ok: true });
  const startedAt = Number(data.startedAt || 0);
  if (startedAt && Date.now() - startedAt < 3000) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const rating = Number(data.rating);
  const authorName = String(data.authorName || "Anonymous").slice(0, 60).trim();
  const title = String(data.title || "").slice(0, 140).trim();
  const body = String(data.body || "").slice(0, 4000).trim();
  const verifiedPurchase = Boolean(data.verifiedPurchase);

  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Rating 1-5 required" }, { status: 400 });
  if (!body) return NextResponse.json({ error: "Review body required" }, { status: 400 });
  if (hasProfanity(body) || hasProfanity(title)) return NextResponse.json({ error: "Profanity not allowed" }, { status: 400 });

  // 👇 New reviews start as PENDING (moderation)
  const created = await prisma.review.create({
    data: {
      productSlug: slug,
      rating,
      title,
      body,
      authorName,
      verifiedPurchase,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, created }, { status: 201 });
}
