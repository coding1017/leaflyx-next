// app/api/catalog/route.ts
import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/catalog.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await getCatalogProducts();
    return NextResponse.json({ ok: true, products });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Failed to load catalog" },
      { status: 500 }
    );
  }
}
