import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function isAuthed(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

const PatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "UNSUBSCRIBED"]),
});

export async function GET(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

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
}

export async function PATCH(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

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
}

export async function DELETE(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  if (!id) return new NextResponse("Missing id", { status: 400 });

  await prisma.subscriber.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
