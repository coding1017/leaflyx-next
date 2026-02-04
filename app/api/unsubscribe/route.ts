// app/api/unsubscribe/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token." }, { status: 400 });
  }

  const sub = await prisma.subscriber.findUnique({ where: { token } });

  if (!sub) {
    return NextResponse.json({ ok: false, error: "Invalid token." }, { status: 404 });
  }

  await prisma.subscriber.update({
    where: { id: sub.id },
    data: {
      status: "unsubscribed",
      unsubscribedAt: new Date(),
    },
  });

  // Simple confirmation (you can redirect to a pretty page later if you want)
  return NextResponse.json({ ok: true });
}
