// app/api/admin/products/[idOrSlug]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

function lower(x: any) {
  return String(x ?? "").trim().toLowerCase();
}

function safeSlug(x: string) {
  return String(x || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/\-+/g, "-")
    .replace(/^\-|\-$/g, "");
}

function toHttpStatus(e: any) {
  const msg = String(e?.message || "");
  if (msg === "UNAUTHORIZED") return 401;
  if (msg === "FORBIDDEN") return 403;
  return 500;
}

async function uploadImageToBlob(file: File, keyPrefix: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN (required for image uploads).");
  }

  const name = String((file as any).name || "image");
  const ext = name.includes(".") ? "." + name.split(".").pop() : "";
  const key = `${keyPrefix}/${crypto.randomUUID()}${ext}`;

  const res = await put(key, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || "application/octet-stream",
  });

  return res.url;
}

async function findProduct(idOrSlug: string) {
  const s = lower(idOrSlug);
  return prisma.catalogProduct.findFirst({
    where: { OR: [{ id: s }, { slug: s }] },
    include: { variants: true },
  });
}

export async function GET(_req: Request, { params }: { params: { idOrSlug: string } }) {
  try {
    await assertAdmin();

    const product = await findProduct(params.idOrSlug);
    if (!product) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, product });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: toHttpStatus(e) });
  }
}

export async function DELETE(_req: Request, { params }: { params: { idOrSlug: string } }) {
  try {
    await assertAdmin();

    const product = await findProduct(params.idOrSlug);
    if (!product) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.inventory.deleteMany({ where: { productId: product.id } });
      await tx.catalogVariant.deleteMany({ where: { productId: product.id } });
      await tx.catalogProduct.delete({ where: { id: product.id } });
    });

    // NOTE: blob files are not deleted (URLs may become orphaned).
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: toHttpStatus(e) });
  }
}

export async function PUT(req: Request, { params }: { params: { idOrSlug: string } }) {
  try {
    await assertAdmin();

    const existing = await findProduct(params.idOrSlug);
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const fd = await req.formData();

    // allow editing these
    const id = String(fd.get("id") || existing.id).trim();
    const slug = String(fd.get("slug") || existing.slug).trim();
    const name = String(fd.get("name") || existing.name).trim();
    const category = String(fd.get("category") || existing.category).trim();

    const subcategories = String(fd.get("subcategories") ?? "").trim();
    const tags = String(fd.get("tags") ?? "").trim();
    const potency = String(fd.get("potency") ?? "").trim();
    const badge = String(fd.get("badge") ?? "").trim();
    const coaUrl = String(fd.get("coaUrl") ?? "").trim();
    const active = String(fd.get("active") ?? String(!!(existing as any).active)) === "true";

    // variantsJson = [{id,label,grams,price,isPopular}]
    const variantsJson = String(fd.get("variantsJson") || "[]");

    // images
    const imageFile = fd.get("image");
    const galleryFiles = fd.getAll("images");

    let imageUrl: string | null = (existing as any).imageUrl ?? null;
    let imageUrls: string[] = Array.isArray((existing as any).imageUrls) ? (existing as any).imageUrls : [];

    const slugKey = safeSlug(slug) || safeSlug(id) || "product";
    const keyPrefix = `leaflyx/products/${slugKey}`;

    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      imageUrl = await uploadImageToBlob(imageFile, `${keyPrefix}/thumb`);
    }

    for (const f of galleryFiles) {
      if (f instanceof File && f.size > 0) {
        const url = await uploadImageToBlob(f, `${keyPrefix}/gallery`);
        imageUrls = [...imageUrls, url];
      }
    }

    if (!imageUrl && imageUrls.length) imageUrl = imageUrls[0];

    // parse variantsJson safely
    let variants: any[] = [];
    try {
      const parsed = JSON.parse(variantsJson);
      variants = Array.isArray(parsed) ? parsed : [];
    } catch {
      variants = [];
    }

    const updated = await prisma.$transaction(async (tx) => {
      const changingId = id !== existing.id;

      if (changingId) {
        await tx.inventory.updateMany({ where: { productId: existing.id }, data: { productId: id } });
        await tx.catalogVariant.updateMany({ where: { productId: existing.id }, data: { productId: id } });
      }

      const p = await tx.catalogProduct.update({
        where: { id: changingId ? id : existing.id },
        data: {
          id,
          slug,
          name,
          category,
          subcategories: subcategories ? subcategories : "[]",
          tags: tags ? tags : "[]",
          potency: potency || null,
          badge: badge || null,
          coaUrl: coaUrl || null,
          active,
          imageUrl,
          imageUrls,
        } as any,
      });

      // Replace variants
      await tx.catalogVariant.deleteMany({ where: { productId: id } });

      if (variants.length) {
        await tx.catalogVariant.createMany({
          data: variants
            .map((v) => ({
              productId: id,
              id: String(v?.id || "").trim(),
              label: v?.label ? String(v.label).trim() : null,
              grams: typeof v?.grams === "number" ? v.grams : null,
              price: typeof v?.price === "number" ? v.price : null,
              isPopular: !!v?.isPopular,
            }))
            .filter((v) => v.id.length > 0) as any,
          skipDuplicates: true,
        });
      }

      // Inventory remains managed in /admin/inventory (no auto rebuild here).
      return p;
    });

    return NextResponse.json({ ok: true, updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: toHttpStatus(e) });
  }
}
