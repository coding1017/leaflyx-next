import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = String(url.searchParams.get("token") ?? "").trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing token." }, { status: 400 });
    }

    const sub = await prisma.subscriber.findUnique({ where: { token } });
    if (!sub) {
      return NextResponse.json({ ok: false, error: "Invalid token." }, { status: 404 });
    }

    await prisma.subscriber.update({
      where: { token },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
    });

    // ✅ use explicit site url first (dev/prod safe)
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:3000" : url.origin);

    return NextResponse.redirect(`${origin}/unsubscribe/success?token=${encodeURIComponent(token)}`, 302);
  } catch {
    return NextResponse.json({ ok: false, error: "Unsubscribe failed." }, { status: 500 });
  }
}
