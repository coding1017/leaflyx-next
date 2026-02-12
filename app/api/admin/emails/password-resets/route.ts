import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomToken, sha256 } from "@/lib/security";

const resend = new Resend(process.env.RESEND_API_KEY);

function isAuthed(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

function emailFrom() {
  // Prefer EMAIL_FROM but allow RESEND_FROM if you used that name
  return (
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "Leaflyx <onboarding@resend.dev>"
  );
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function buildResetHtml(url: string) {
  return `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
    <h2 style="margin:0 0 10px;">Reset your password</h2>
    <p style="margin:0 0 14px; color:#333;">
      Click below to reset your password. This link expires in 30 minutes.
    </p>
    <p style="margin:0 0 14px;">
      <a href="${url}" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;border-radius:10px;text-decoration:none;">
        Reset password
      </a>
    </p>
    <p style="margin:0; color:#666; font-size:12px;">
      If you didn’t request this, ignore this email.
    </p>
  </div>`;
}

const ResendSchema = z.object({
  id: z.string().min(1),
});

export async function GET(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const show = (searchParams.get("show") || "active").toLowerCase(); // active | all

  const tokens = await prisma.passwordResetToken.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { user: { select: { email: true } } },
  });

  const now = Date.now();

  const rows = tokens
    .map((t) => {
      const expired = t.expiresAt.getTime() < now;
      const used = !!t.usedAt;
      const active = !expired && !used;

      return {
        id: t.id,
        userEmail: t.user?.email || "",
        createdAt: t.createdAt.toISOString(),
        expiresAt: t.expiresAt.toISOString(),
        usedAt: t.usedAt ? t.usedAt.toISOString() : null,
        status: active ? "ACTIVE" : used ? "USED" : "EXPIRED",
      } as const;
    })
    .filter((r) => {
      if (show !== "all" && r.status !== "ACTIVE") return false;
      if (!q) return true;
      return r.userEmail.toLowerCase().includes(q) || r.status.toLowerCase().includes(q);
    });

  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

  if (!process.env.RESEND_API_KEY) {
    return new NextResponse("Missing RESEND_API_KEY", { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ResendSchema.safeParse(body);
  if (!parsed.success) return new NextResponse("Invalid body", { status: 400 });

  const rec = await prisma.passwordResetToken.findUnique({
    where: { id: parsed.data.id },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!rec || !rec.user?.email) return new NextResponse("Not found", { status: 404 });

  // Create a NEW token (we cannot resend the old one because DB only stores the hash)
  const token = randomToken(32);
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.$transaction([
    prisma.passwordResetToken.create({
      data: {
        userId: rec.userId,
        tokenHash,
        expiresAt,
      },
    }),
    // mark the old one used so it stops being "active"
    prisma.passwordResetToken.update({
      where: { id: rec.id },
      data: { usedAt: new Date() },
    }),
  ]);

  const url = `${baseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: emailFrom(),
    to: rec.user.email,
    subject: "Reset your Leaflyx password",
    html: buildResetHtml(url),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  if (!id) return new NextResponse("Missing id", { status: 400 });

  await prisma.passwordResetToken.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
