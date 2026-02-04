import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import argon2 from "argon2";
import { sha256 } from "@/lib/security";
import { getIp, rateLimit } from "@/lib/rateLimit";

const Schema = z.object({
  token: z.string().min(20),
  password: z.string().min(10),
});

export async function POST(req: Request) {
  const ip = getIp(req);

  // ✅ Rate limit reset attempts (per IP)
  const rl = rateLimit({ key: `reset:${ip}`, limit: 20, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const tokenHash = sha256(parsed.data.token);

  const rec = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!rec) return NextResponse.json({ ok: false, error: "Invalid or expired link." }, { status: 400 });
  if (rec.usedAt) return NextResponse.json({ ok: false, error: "This link was already used." }, { status: 400 });
  if (rec.expiresAt.getTime() < Date.now())
    return NextResponse.json({ ok: false, error: "This link has expired." }, { status: 400 });

  const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: rec.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true }, { status: 200 });
}
