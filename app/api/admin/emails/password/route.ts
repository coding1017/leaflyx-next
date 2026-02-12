// app/api/admin/emails/password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { z } from "zod";
import { randomToken, sha256 } from "@/lib/security";

const resend = new Resend(process.env.RESEND_API_KEY);

function isAuthed(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

function emailFromEnv() {
  // Use either one; your app currently uses EMAIL_FROM successfully.
  return (
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "Leaflyx <onboarding@resend.dev>"
  );
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function GET(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const status = (searchParams.get("status") || "ALL").toUpperCase();

  const where: any = {};
  if (q) {
    where.OR = [
      { user: { email: { contains: q, mode: "insensitive" } } },
      { userId: { contains: q, mode: "insensitive" } },
    ];
  }

  // Status filter (computed with usedAt/expiresAt)
  const now = new Date();
  if (status === "PENDING") {
    where.usedAt = null;
    where.expiresAt = { gt: now };
  } else if (status === "USED") {
    where.usedAt = { not: null };
  } else if (status === "EXPIRED") {
    where.usedAt = null;
    where.expiresAt = { lt: now };
  }

  const rows = await prisma.passwordResetToken.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      userId: true,
      createdAt: true,
      expiresAt: true,
      usedAt: true,
      user: { select: { email: true } },
    },
  });

  return NextResponse.json({
    rows: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      email: r.user.email,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
      usedAt: r.usedAt ? r.usedAt.toISOString() : null,
    })),
  });
}

const PostSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return new NextResponse("Invalid email", { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // For admin, we can still respond clearly.
    return NextResponse.json({ ok: false, message: "No user found for that email." }, { status: 200 });
  }

  // Optional hygiene: remove old unused tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  // Create token (store only hash)
  const token = randomToken(32);
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  if (!process.env.RESEND_API_KEY) {
    return new NextResponse("Missing RESEND_API_KEY", { status: 500 });
  }

  const url = `${baseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: emailFromEnv(),
    to: email,
    subject: "Reset your Leaflyx password",
    html: `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.45">
        <h2 style="margin:0 0 12px 0;">Reset your password</h2>
        <p style="margin:0 0 14px 0;">Click the button below to reset your password. This link expires in 30 minutes.</p>
        <p style="margin:0 0 16px 0;">
          <a href="${url}" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;border-radius:12px;text-decoration:none;">
            Reset password
          </a>
        </p>
        <p style="color:#666;font-size:12px;margin:0;">If you didn’t request this, you can ignore this email.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true, message: `Sent a new reset link to ${email}.` });
}

export async function DELETE(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  const cleanup = searchParams.get("cleanup") === "1";

  if (id) {
    await prisma.passwordResetToken.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ ok: true });
  }

  if (cleanup) {
    const now = new Date();
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { usedAt: { not: null } },
          { usedAt: null, expiresAt: { lt: now } },
        ],
      },
    });
    return NextResponse.json({ ok: true, deleted: result.count });
  }

  return new NextResponse("Missing id or cleanup=1", { status: 400 });
}
