import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

async function getAuthedUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id ?? null;
}

function normalizeHandle(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

function toNullableString(v: any): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

export async function GET() {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      handle: true,
      birthday: true,

      // ✅ private contact + shipping address
      phone: true,
      address1: true,
      address2: true,
      city: true,
      state: true,
      postal: true,
      country: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}

export async function PUT(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // Existing fields
  const name = String(body?.name ?? "").trim();
  const rawHandle = String(body?.handle ?? "").trim();
  const rawBirthday = String(body?.birthday ?? "").trim();

  const handle = rawHandle ? normalizeHandle(rawHandle) : null;

  if (handle && (handle.length < 3 || handle.length > 24)) {
    return NextResponse.json(
      { ok: false, error: "Handle must be 3–24 characters." },
      { status: 400 }
    );
  }

  if (handle) {
    const existing = await prisma.user.findFirst({
      where: { handle, NOT: { id: userId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "That handle is already taken." },
        { status: 400 }
      );
    }
  }

  // Birthday parsing (YYYY-MM-DD)
  let birthday: Date | null = null;
  if (rawBirthday) {
    const parsed = new Date(`${rawBirthday}T00:00:00Z`);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { ok: false, error: "Invalid birthday format." },
        { status: 400 }
      );
    }
    birthday = parsed;
  }

  // ✅ Address fields (private)
  const phone = toNullableString(body?.phone);
  const address1 = toNullableString(body?.address1);
  const address2 = toNullableString(body?.address2);
  const city = toNullableString(body?.city);
  const state = toNullableString(body?.state);
  const postal = toNullableString(body?.postal);
  const country = toNullableString(body?.country);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || null,
      handle,
      birthday,

      // ✅ persist address
      phone,
      address1,
      address2,
      city,
      state,
      postal,
      country,
    },
    select: {
      email: true,
      name: true,
      handle: true,
      birthday: true,

      phone: true,
      address1: true,
      address2: true,
      city: true,
      state: true,
      postal: true,
      country: true,
    },
  });

  return NextResponse.json({ ok: true, user: updated });
}
