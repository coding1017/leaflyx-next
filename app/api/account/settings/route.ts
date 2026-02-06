import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PatchSchema = z
  .object({
    publicProfileEnabled: z.boolean().optional(),
    analyticsOptIn: z.boolean().optional(),
    publicBio: z.string().max(280).nullable().optional(),
    handle: z
      .string()
      .min(3)
      .max(24)
      .regex(/^[a-z0-9_]+$/i, "Handle can only use letters, numbers, underscores")
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "No changes provided");

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      handle: true,
      publicProfileEnabled: true,
      publicBio: true,
      analyticsOptIn: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // If enabling public profile, require handle
  if (data.publicProfileEnabled === true) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { handle: true },
    });
    const incomingHandle = data.handle?.trim() || current?.handle?.trim();

    if (!incomingHandle) {
      return NextResponse.json(
        { ok: false, error: "Set a public handle before enabling a public profile." },
        { status: 400 }
      );
    }
  }

  // Normalize handle to lowercase for clean URLs
  const updateData: any = {};
  if (typeof data.handle === "string") updateData.handle = data.handle.trim().toLowerCase();
  if (typeof data.publicProfileEnabled === "boolean")
    updateData.publicProfileEnabled = data.publicProfileEnabled;
  if (typeof data.analyticsOptIn === "boolean") updateData.analyticsOptIn = data.analyticsOptIn;
  if (data.publicBio !== undefined) updateData.publicBio = data.publicBio;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Handle unique constraint on handle
    const msg = String(err?.message || "");
    if (msg.toLowerCase().includes("unique") && msg.toLowerCase().includes("handle")) {
      return NextResponse.json({ ok: false, error: "That handle is already taken." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Update failed." }, { status: 400 });
  }
}
