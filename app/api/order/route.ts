// app/api/order/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { decrementStock } from "@/lib/db";

const Schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    // Coerce + normalize in case the client sends quantity as string
    const normalized = {
      items: Array.isArray(body?.items)
        ? body.items
            .map((it: any) => ({
              productId: String(it?.productId ?? "").trim(),
              quantity: Number(it?.quantity),
            }))
            .filter((it: any) => it.productId && Number.isFinite(it.quantity))
            .map((it: any) => ({
              productId: it.productId,
              quantity: Math.max(1, Math.floor(it.quantity)),
            }))
        : [],
    };

    const parsed = Schema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const updated = decrementStock(parsed.data.items);
    return NextResponse.json({ ok: true, products: updated });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Order error" },
      { status: 400 }
    );
  }
}
