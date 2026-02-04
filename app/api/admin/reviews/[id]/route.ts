import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const revalidate = 0;

function isAdmin() {
  return process.env.ADMIN_TOKEN && headers().get("x-admin-token") === process.env.ADMIN_TOKEN;
}

// POST /api/admin/reviews/123  body: { action: "APPROVE" | "REJECT" }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const { action } = await req.json().catch(() => ({ action: "" })) as { action?: string };
  const A = String(action || "").toUpperCase();
  if (!["APPROVE", "REJECT"].includes(A)) {
    return NextResponse.json({ error: "Action must be APPROVE or REJECT" }, { status: 400 });
  }

  const review = await prisma.review.update({
    where: { id },
    data: { status: A === "APPROVE" ? "APPROVED" : "REJECTED" },
  });

  return NextResponse.json({ ok: true, review });
}
