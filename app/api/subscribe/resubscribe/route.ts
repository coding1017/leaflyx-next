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

    // Flip them back to ACTIVE
    await prisma.subscriber.update({
      where: { token },
      data: {
        status: "ACTIVE",
        unsubscribedAt: null,
      },
    });

    // ✅ Send them to Shop after resubscribe
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:3000" : url.origin);

    return NextResponse.redirect(`${origin}/products?resubscribed=1`, 302);
  } catch {
    return NextResponse.json({ ok: false, error: "Resubscribe failed." }, { status: 500 });
  }
}
