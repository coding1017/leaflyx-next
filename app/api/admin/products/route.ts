// app/api/admin/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

function requireAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

function canon(v: string | null | undefined) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function parseBool(v: string, fallback = true) {
  const s = (v ?? "").trim().toLowerCase();
  if (!s) return fallback;
  if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return fallback;
}

function parseFloatOrNull(v: string) {
  const s = (v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseJsonArrayOrCsv(v: string): any[] {
  const s = (v ?? "").trim();
  if (!s) return [];
  if (s.startsWith("[")) {
    try {
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

async function uploadFileToBlob(file: File, folder: string) {
  const safeName = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "-");
  const key = `${folder}/${Date.now()}-${safeName}`;
  const res = await put(key, file, {
    access: "public",
    contentType: file.type || "application/octet-stream",
  });
  return res.url;
}

type VariantInput = {
  id: string;
  label?: string | null;
  grams?: number | null;
  price?: number | null;
  isPopular?: boolean;
  initialQty?: number | null;
};

async function ensureInventoryRow(tx: any, productId: string, variant: string | null, qty: number) {
  // ✅ Avoid compound unique typing issues with nullable variant:
  const existing = await tx.inventory.findFirst({
    where: { productId, variant },
    select: { id: true },
  });

  if (existing?.id) {
    await tx.inventory.update({
      where: { id: existing.id },
      data: { qty },
    });
    return;
  }

  await tx.inventory.create({
    data: { productId, variant, qty },
  });
}

export async function GET(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.catalogProduct.findMany({
      include: { variants: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();

    const id = asString(form.get("id")).trim();
    const slug = asString(form.get("slug")).trim();
    const name = asString(form.get("name")).trim();
    const category = asString(form.get("category")).trim();

    const potency = canon(asString(form.get("potency")));
    const badge = canon(asString(form.get("badge")));
    const coaUrl = canon(asString(form.get("coaUrl")));

    const active = parseBool(asString(form.get("active")), true);
    const price = parseFloatOrNull(asString(form.get("price")));

    const subcategories = parseJsonArrayOrCsv(asString(form.get("subcategories")));
    const tags = parseJsonArrayOrCsv(asString(form.get("tags")));

    const variantsJson = asString(form.get("variantsJson")).trim();
    let variants: VariantInput[] = [];

    if (variantsJson) {
      try {
        const parsed = JSON.parse(variantsJson);
        if (Array.isArray(parsed)) variants = parsed;
      } catch {
        return NextResponse.json(
          { ok: false, error: "Invalid variantsJson (must be JSON array)" },
          { status: 400 }
        );
      }
    }

    if (!id || !slug || !name || !category) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: id, slug, name, category" },
        { status: 400 }
      );
    }

    variants = variants
      .map((v) => ({ ...v, id: String(v.id ?? "").trim() }))
      .filter((v) => v.id.length > 0);

    const set = new Set<string>();
    for (const v of variants) {
      if (set.has(v.id)) {
        return NextResponse.json({ ok: false, error: `Duplicate variant id: ${v.id}` }, { status: 400 });
      }
      set.add(v.id);
    }

    // Upload images to Blob
    let imageUrl: string | null = null;

    const imageFile = form.get("image");
    if (imageFile && typeof imageFile === "object" && "arrayBuffer" in imageFile) {
      imageUrl = await uploadFileToBlob(imageFile as File, "products");
    }

    const galleryFiles = form.getAll("images");
    const imageUrls: string[] = [];
    for (const gf of galleryFiles) {
      if (gf && typeof gf === "object" && "arrayBuffer" in gf) {
        imageUrls.push(await uploadFileToBlob(gf as File, "products"));
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.catalogProduct.create({
        data: {
          id,
          slug,
          name,
          category,
          subcategories,
          tags,
          price: price ?? undefined,
          potency: potency ?? undefined,
          badge: badge ?? undefined,
          coaUrl: coaUrl ?? undefined,
          active,
          imageUrl: imageUrl ?? undefined,
          imageUrls,
        },
      });

      if (variants.length) {
        await tx.catalogVariant.createMany({
          data: variants.map((v) => ({
            productId: id,
            id: v.id,
            label: v.label ? String(v.label) : null,
            grams: v.grams ?? null,
            price: v.price ?? null,
            isPopular: !!v.isPopular,
          })),
        });
      }

      // ✅ inventory rows (null-safe)
      if (!variants.length) {
        await ensureInventoryRow(tx, id, null, 0);
      } else {
        for (const v of variants) {
          const initialQty = Number(v.initialQty ?? 0);
          const qty = Number.isFinite(initialQty) && initialQty >= 0 ? Math.floor(initialQty) : 0;
          await ensureInventoryRow(tx, id, v.id, qty);
        }
      }

      const full = await tx.catalogProduct.findUnique({
        where: { id },
        include: { variants: true },
      });

      return full ?? product;
    });

    return NextResponse.json({ ok: true, created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed" }, { status: 500 });
  }
}
