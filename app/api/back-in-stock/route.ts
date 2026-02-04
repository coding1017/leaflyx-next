// app/api/back-in-stock/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const productId = String(body?.productId ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();

    // IMPORTANT: allow null for "any size"
    const rawVariant = body?.variant;
    const variant: string | null =
      rawVariant === undefined || rawVariant === null || String(rawVariant).trim() === ""
        ? null
        : String(rawVariant).trim();

    if (!productId || !email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    try {
      await prisma.backInStockRequest.create({
        data: { productId, variant, email },
      });
    } catch (err: any) {
      // If it's a duplicate (unique constraint), treat as success.
      // Prisma uses code "P2002" for unique constraint violations.
      if (err?.code !== "P2002") throw err;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/back-in-stock error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
