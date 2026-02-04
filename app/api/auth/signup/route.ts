// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import argon2 from "argon2";
import { z } from "zod";
import { getIp, rateLimit } from "@/lib/rateLimit";

function isYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function parseBirthdayToUTCDate(yyyy_mm_dd: string): Date | null {
  if (!isYYYYMMDD(yyyy_mm_dd)) return null;
  const d = new Date(`${yyyy_mm_dd}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

function is21OrOlder(dobUTC: Date) {
  const now = new Date();
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear() - 21, now.getUTCMonth(), now.getUTCDate())
  );
  return dobUTC <= cutoff;
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  name: z.string().min(1).max(80).optional(),
  // ✅ NEW: birthday required (YYYY-MM-DD)
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: Request) {
  const ip = getIp(req);

  // ✅ Rate limit signup attempts (per IP)
  const rl = rateLimit({ key: `signup:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many signup attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Email already in use" }, { status: 409 });
    }

    // ✅ Birthday validation + age gate (21+)
    const dob = parseBirthdayToUTCDate(parsed.data.birthday);
    if (!dob) {
      return NextResponse.json(
        { ok: false, error: "Birthday must be in YYYY-MM-DD format." },
        { status: 400 }
      );
    }
    if (!is21OrOlder(dob)) {
      return NextResponse.json(
        { ok: false, error: "You must be 21+ to create an account." },
        { status: 400 }
      );
    }

    // ✅ Never plaintext — salted hash
    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
        role: "USER",
        birthday: dob, // ✅ NEW
      },
    });

    // Optional bootstrap superadmin
    const adminEmail = process.env.SUPERADMIN_EMAIL?.toLowerCase();
    if (adminEmail && user.email === adminEmail) {
      await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Signup error" }, { status: 400 });
  }
}
