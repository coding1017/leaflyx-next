// app/api/admin/discounts/analytics/route.ts
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function toHttpStatus(e: any) {
  const msg = String(e?.message || "");
  if (msg === "UNAUTHORIZED") return 401;
  if (msg === "FORBIDDEN") return 403;
  return 500;
}

export async function GET() {
  try {
    await assertAdmin();

    const rows = await prisma.discountRedemption.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
      select: {
        codeSnapshot: true,
        subtotalCents: true,
        discountCents: true,
        totalCents: true,
        itemsJson: true,
        createdAt: true,
      },
    });

    const byCode: Record<
      string,
      {
        code: string;
        uses: number;
        subtotalCents: number;
        discountCents: number;
        totalCents: number;
        topItems: Record<string, number>;
        lastUsedAt: string | null;
      }
    > = {};

    for (const r of rows) {
      const code = r.codeSnapshot;
      if (!byCode[code]) {
        byCode[code] = {
          code,
          uses: 0,
          subtotalCents: 0,
          discountCents: 0,
          totalCents: 0,
          topItems: {},
          lastUsedAt: null,
        };
      }

      const bucket = byCode[code];
      bucket.uses += 1;
      bucket.subtotalCents += r.subtotalCents;
      bucket.discountCents += r.discountCents;
      bucket.totalCents += r.totalCents;

      const iso = r.createdAt.toISOString();
      bucket.lastUsedAt = bucket.lastUsedAt ? (iso > bucket.lastUsedAt ? iso : bucket.lastUsedAt) : iso;

      const items = ((r.itemsJson as any[]) ?? []) as any[];
      for (const it of items) {
        const name = String(it?.name ?? "Unknown");
        const qty = Number(it?.qty ?? 0);
        bucket.topItems[name] = (bucket.topItems[name] ?? 0) + qty;
      }
    }

    const summary = Object.values(byCode).map((b) => {
      const top = Object.entries(b.topItems)
        .sort((a, c) => c[1] - a[1])
        .slice(0, 5)
        .map(([name, qty]) => ({ name, qty }));

      return {
        code: b.code,
        uses: b.uses,
        subtotalCents: b.subtotalCents,
        discountCents: b.discountCents,
        totalCents: b.totalCents,
        lastUsedAt: b.lastUsedAt,
        topItems: top,
      };
    });

    summary.sort((a, b) => b.totalCents - a.totalCents);

    return NextResponse.json({ ok: true, summary });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Forbidden" }, { status: toHttpStatus(e) });
  }
}
