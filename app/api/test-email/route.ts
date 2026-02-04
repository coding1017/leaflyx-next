import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: ["leaflyx.co@gmail.com"], // send to yourself
      subject: "Leaflyx Test Email ✅",
      html: `
        <div style="font-family: system-ui; padding: 24px">
          <h1 style="color:#d4af37">Leaflyx Email Test</h1>
          <p>Your Resend integration is working correctly.</p>
          <p style="opacity:0.6;font-size:12px">
            You can safely proceed to restock notifications.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
