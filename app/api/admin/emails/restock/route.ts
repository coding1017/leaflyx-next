// app/api/admin/emails/restock/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

function isAuthed(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

type Row = {
  id: string;
  email: string;
  productId: string;
  variant: string | null;
  createdAt: Date;
};

function buildText(r: Row) {
  return [
    "Good news — your item is back in stock!",
    "",
    `Product: ${r.productId}`,
    `Variant: ${r.variant ?? "Any"}`,
    "",
    "Visit the shop to purchase.",
  ].join("\n");
}

export async function GET(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId")?.trim() || "";
  const email = searchParams.get("email")?.trim() || "";

  const where: any = {};
  if (productId) where.productId = productId;
  if (email) where.email = { contains: email, mode: "insensitive" };

  const rows = await prisma.backInStockRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      email: true,
      productId: true,
      variant: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id?.trim();
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const row = await prisma.backInStockRequest.findUnique({
    where: { id },
    select: { id: true, email: true, productId: true, variant: true, createdAt: true },
  });

  if (!row) return new NextResponse("Not found", { status: 404 });

  // Send email
  if (!process.env.RESEND_API_KEY) {
    return new NextResponse("Missing RESEND_API_KEY", { status: 500 });
  }

  const subject = "Leaflyx — Back in stock";
  const text = buildText(row);

  await resend.emails.send({
    from: "Leaflyx <no-reply@leaflyx.co>",
    to: row.email,
    subject,
    text,
  });

  // ✅ Since there is no notifiedAt, we “mark complete” by deleting the request.
  await prisma.backInStockRequest.delete({ where: { id: row.id } });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  // Delete single request
  if (id) {
    await prisma.backInStockRequest.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ ok: true });
  }

  // Bulk delete stale requests older than N days (default 30)
  const days = Number(searchParams.get("days") || "30");
  const cutoff = new Date(Date.now() - Math.max(1, days) * 86400_000);

  const result = await prisma.backInStockRequest.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
