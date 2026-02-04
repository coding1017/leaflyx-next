// app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

type Body = { email: string; source?: string };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(raw: string) {
  return String(raw ?? "").trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<Body>;
    const email = normalizeEmail(body?.email ?? "");
    const source = typeof body?.source === "string" ? body.source : "cart_offline_notice";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }

    // --- Upsert subscriber in DB ---
    const token = crypto.randomBytes(24).toString("hex");

    const existing = await prisma.subscriber.findUnique({ where: { email } });

    const subscriber = existing
      ? await prisma.subscriber.update({
          where: { email },
          data: {
            status: "subscribed",
            unsubscribedAt: null,
            lastSubscribedAt: new Date(),
            source,
            token, // rotate token on re-subscribe
          },
        })
      : await prisma.subscriber.create({
          data: {
            email,
            status: "subscribed",
            source,
            token,
            lastSubscribedAt: new Date(),
          },
        });

    // --- Email confirmation via Resend ---
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM; // e.g. "Leaflyx <updates@leaflyx.com>"
    if (!apiKey || !from) {
      return NextResponse.json(
        { ok: false, error: "Email service not configured (missing RESEND_API_KEY / RESEND_FROM)." },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const unsubUrl = `${siteUrl}/api/unsubscribe?token=${subscriber.token}`;

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from,
      to: email,
      subject: "You’re subscribed — Leaflyx updates",
      html: `
        <div style="font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial; line-height: 1.5;">
          <h2 style="margin:0 0 12px 0;">Welcome to Leaflyx updates</h2>
          <p style="margin:0 0 12px 0;">
            Thanks for subscribing. We’ll email you the latest news and a special promo code for the inconvenience while the site is offline.
          </p>

          <p style="margin:16px 0 0;color:#666;font-size:12px;">
            You can unsubscribe anytime:
            <a href="${unsubUrl}" style="color:#111;text-decoration:underline;">Unsubscribe</a>
          </p>

          <p style="margin:10px 0 0;color:#666;">
            Leaflyx • Premium THCA goods
          </p>
        </div>
      `,
    });

    // Optional: notify you
    const admin = process.env.SUBSCRIBE_NOTIFY_TO;
    if (admin) {
      await resend.emails.send({
        from,
        to: admin,
        subject: "New Leaflyx subscriber",
        html: `<p><strong>${email}</strong> subscribed (source: ${source}).</p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Subscribe failed:", e);
    return NextResponse.json({ ok: false, error: "Subscribe failed." }, { status: 500 });
  }
}
