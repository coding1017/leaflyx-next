import { NextResponse } from "next/server";

function isAuthed(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

export async function POST(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { productId, variant } = body || {};

  // NEXT STEP:
  // Wire this to your existing "force resend" logic in app/api/admin/inventory/route.ts
  // so clicking Resend triggers the email send for that product/variant.

  return NextResponse.json({
    ok: true,
    message: `Resend queued (wire next): productId=${productId ?? "—"} variant=${variant ?? "—"}`,
  });
}
