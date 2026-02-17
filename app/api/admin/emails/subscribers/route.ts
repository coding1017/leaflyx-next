// app/api/admin/emails/subscribers/route.ts
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

function toHttpStatus(e: any) {
  const msg = String(e?.message || "");
  if (msg === "UNAUTHORIZED") return 401;
  if (msg === "FORBIDDEN") return 403;
  return 500;
}

const PatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "UNSUBSCRIBED"]),
});

export async function GET(req: Request) {
  try {
    await assertAdmin();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const status = (searchParams.get("status") || "ALL").toUpperCase(); // ACTIVE | UNSUBSCRIBED | ALL

    const rows = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const filtered = rows
      .filter((r) => {
        if (status !== "ALL" && r.status.toUpperCase() !== status) return false;
        if (!q) return true;
        return (
          r.email.toLowerCase().includes(q) ||
          (r.source || "").toLowerCase().includes(q) ||
          (r.tags || "").toLowerCase().includes(q)
        );
      })
      .map((r) => ({
        id: r.id,
        email: r.email,
        status: r.status,
        source: r.source,
        tags: r.tags,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        unsubscribedAt: r.unsubscribedAt ? r.unsubscribedAt.toISOString() : null,
      }));

    return NextResponse.json({ rows: filtered });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: toHttpStatus(e) });
  }
}

export async function PATCH(req: Request) {
  try {
    await assertAdmin();

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) return new NextResponse("Invalid body", { status: 400 });

    const nextStatus = parsed.data.status;

    await prisma.subscriber.update({
      where: { id: parsed.data.id },
      data: {
        status: nextStatus,
        unsubscribedAt: nextStatus === "UNSUBSCRIBED" ? new Date() : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: toHttpStatus(e) });
  }
}

export async function DELETE(req: Request) {
  try {
    await assertAdmin();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();
    if (!id) return new NextResponse("Missing id", { status: 400 });

    await prisma.subscriber.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: toHttpStatus(e) });
  }
}
