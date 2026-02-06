// app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // ✅ Next.js App Router safe way (doesn't trigger static render error)
    const token = String(req.nextUrl.searchParams.get("token") ?? "").trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing token." }, { status: 400 });
    }

    // Update directly by token (simpler + atomic)
    const updated = await prisma.subscriber
      .update({
        where: { token },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: new Date(),
        },
        select: { token: true },
      })
      .catch(() => null);

    if (!updated) {
      return NextResponse.json({ ok: false, error: "Invalid token." }, { status: 404 });
    }

    // Prefer your public site URL if set; otherwise use request origin
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const origin = (envUrl ? envUrl : req.nextUrl.origin).replace(/\/+$/, "");

    // Nice UX: redirect to confirmation page
    return NextResponse.redirect(
      `${origin}/unsubscribe/success?token=${encodeURIComponent(token)}`,
      302
    );
  } catch (e) {
    console.error("Unsubscribe failed:", e);
    return NextResponse.json({ ok: false, error: "Unsubscribe failed." }, { status: 500 });
  }
}
