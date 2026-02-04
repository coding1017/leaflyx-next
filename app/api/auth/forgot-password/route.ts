import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Resend } from "resend";
import { randomToken, sha256 } from "@/lib/security";
import { getIp, rateLimit } from "@/lib/rateLimit";

const resend = new Resend(process.env.RESEND_API_KEY);

const Schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const ip = getIp(req);

  // ✅ Rate limit forgot password (per IP)
  const rl = rateLimit({ key: `forgot:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: true }, // do not reveal anything
      { status: 200 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    // still return ok to avoid enumeration via validation errors
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  // ✅ Always respond ok (prevents email enumeration)
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true }, { status: 200 });

  // Create token (store only hash)
  const token = randomToken(32);
  const tokenHash = sha256(token);

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      ipHash: sha256(ip),
    },
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${base}/reset-password?token=${encodeURIComponent(token)}`;

  const from = process.env.EMAIL_FROM || "no-reply@example.com";

  await resend.emails.send({
    from,
    to: email,
    subject: "Reset your Leaflyx password",
    html: `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
        <p><a href="${url}" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;border-radius:10px;text-decoration:none;">Reset password</a></p>
        <p style="color:#666;font-size:12px;">If you didn’t request this, you can ignore this email.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
