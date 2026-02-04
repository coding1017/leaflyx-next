// app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

type Body = { email: string };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM; // e.g. "Leaflyx <updates@leaflyx.com>"
    if (!apiKey || !from) {
      return NextResponse.json(
        { ok: false, error: "Email service not configured (missing RESEND_API_KEY / RESEND_FROM)." },
        { status: 500 }
      );
    }

    // Prefer a public site URL for email links; fallback to request origin
    const origin =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://leaflyx.co");

    // Upsert subscriber
    const existing = await prisma.subscriber.findUnique({ where: { email } });

    const token = existing?.token ?? makeToken();

    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      create: {
        email,
        token,
        status: "ACTIVE",
        source: "cart_notice_modal",
        tags: "offline,promo",
      },
      update: {
        token, // keep stable if already present
        status: "ACTIVE",
        source: existing?.source ?? "cart_notice_modal",
        tags: existing?.tags ?? "offline,promo",
        unsubscribedAt: null,
      },
    });

    // Only send the welcome email if:
    // - brand new subscriber, OR
    // - previously unsubscribed (now re-activated)
    const shouldSend =
      !existing || (existing?.status && existing.status.toUpperCase() === "UNSUBSCRIBED");

    const unsubscribeUrl = `${origin}/api/subscribe/unsubscribe?token=${token}`;

    if (shouldSend) {
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

            <div style="margin:18px 0 0 0; padding:12px 14px; border:1px solid rgba(0,0,0,0.10); border-radius:12px; background:#f7f7f7;">
              <div style="font-size:12px; color:#666; margin-bottom:6px;">
                Manage subscription
              </div>
              <a href="${unsubscribeUrl}" style="display:inline-block; font-size:13px; color:#111; text-decoration:underline;">
                Unsubscribe
              </a>
            </div>

            <p style="margin:14px 0 0 0; color:#666; font-size:12px;">
              Leaflyx • Premium THCA goods
            </p>
          </div>
        `,
        // Optional but helpful for some clients:
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
        },
      });

      // Optional: notify you (set this env if you want)
      const admin = process.env.SUBSCRIBE_NOTIFY_TO; // your inbox
      if (admin) {
        await resend.emails.send({
          from,
          to: admin,
          subject: "New Leaflyx subscriber",
          html: `<p><b>${email}</b> subscribed from the cart notice modal.</p>`,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Subscribe failed." }, { status: 500 });
  }
}
