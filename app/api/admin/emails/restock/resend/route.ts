// app/api/admin/emails/restock/resend/route.ts
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

function toHttpStatus(e: any) {
  const msg = String(e?.message || "");
  if (msg === "UNAUTHORIZED") return 401;
  if (msg === "FORBIDDEN") return 403;
  return 500;
}

export async function POST(req: Request) {
  try {
    await assertAdmin();

    const body = await req.json().catch(() => ({}));
    const { productId, variant } = (body || {}) as { productId?: string; variant?: string | null };

    // NEXT STEP:
    // Wire this to your existing "force resend" logic in app/api/admin/inventory/route.ts
    // so clicking Resend triggers the email send for that product/variant.

    return NextResponse.json({
      ok: true,
      message: `Resend queued (wire next): productId=${productId ?? "—"} variant=${variant ?? "—"}`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: toHttpStatus(e) });
  }
}
