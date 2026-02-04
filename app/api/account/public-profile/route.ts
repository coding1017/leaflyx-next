import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PatchSchema = z.object({
  publicProfileEnabled: z.boolean(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { publicProfileEnabled: true, handle: true, publicBio: true },
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
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  // Require a handle before allowing public profiles (prevents weird URLs)
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { handle: true },
  });

  if (parsed.data.publicProfileEnabled && !current?.handle) {
    return NextResponse.json(
      { ok: false, error: "Set a public handle before enabling a public profile." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { publicProfileEnabled: parsed.data.publicProfileEnabled },
  });

  return NextResponse.json({ ok: true });
}
