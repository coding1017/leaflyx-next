export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

function authed(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

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

async function uploadImageToBlob(file: File, keyPrefix: string) {
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

export async function GET(req: Request, { params }: { params: { idOrSlug: string } }) {
  try {
    if (!authed(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const product = await findProduct(params.idOrSlug);
    if (!product) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, product });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { idOrSlug: string } }) {
  try {
    if (!authed(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const product = await findProduct(params.idOrSlug);
    if (!product) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // delete inventory rows for this product
      await tx.inventory.deleteMany({ where: { productId: product.id } });

      // delete variants
      await tx.catalogVariant.deleteMany({ where: { productId: product.id } });

      // delete product
      await tx.catalogProduct.delete({ where: { id: product.id } });
    });

    // NOTE: we are not deleting blob files here (URLs will just become orphaned).
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { idOrSlug: string } }) {
  try {
    if (!authed(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

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
    const active = String(fd.get("active") ?? String(!!existing.active)) === "true";

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
      // 1) update product (including id)
      // If you change ID, we need to update children too.
      const changingId = id !== existing.id;

      if (changingId) {
        // update children first to new productId
        await tx.inventory.updateMany({ where: { productId: existing.id }, data: { productId: id } });
        await tx.catalogVariant.updateMany({ where: { productId: existing.id }, data: { productId: id } });
      }

      // update product row
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

      // 2) replace variants (simple + reliable)
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
        });
      }

      // NOTE: we are not auto-rebuilding inventory rows here because you already have
      // inventory tooling; you can keep inventory management in /admin/inventory.
      return p;
    });

    return NextResponse.json({ ok: true, updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
