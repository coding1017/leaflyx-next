// app/api/unsubscribe/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = String(url.searchParams.get("token") ?? "").trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing token." }, { status: 400 });
    }

    // Update directly by token (simpler + atomic)
    const updated = await prisma.subscriber.update({
      where: { token },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
      select: { token: true },
    }).catch(() => null);

    if (!updated) {
      return NextResponse.json({ ok: false, error: "Invalid token." }, { status: 404 });
    }

    const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const origin = (envUrl ? envUrl : url.origin).replace(/\/+$/, "");

    // Nice UX: redirect to confirmation page
    return NextResponse.redirect(
      `${origin}/unsubscribe/success?token=${encodeURIComponent(token)}`,
      302
    );
  } catch (e) {
    console.error("Unsubscribe failed:", e);
    // If anything unexpected happens, at least respond
    return NextResponse.json({ ok: false, error: "Unsubscribe failed." }, { status: 500 });
  }
}
