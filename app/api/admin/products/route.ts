// app/api/admin/products/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

function authed(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

function str(v: unknown) {
  return String(v ?? "").trim();
}

function asNumOrNull(v: unknown): number | null {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function parseJsonOrCsvArray(input: string): any[] {
  const s = String(input ?? "").trim();
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    if (Array.isArray(v)) return v;
  } catch {
    // ignore
  }
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

async function uploadToBlob(file: File, path: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN (required for image uploads).");
  }
  const res = await put(path, file, { access: "public" });
  return res.url;
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function blobPath(kind: "thumb" | "gallery", productSlug: string, filename: string) {
  const ts = Date.now();
  const cleanSlug = productSlug || "product";
  const clean = safeFileName(filename || "image.png");
  return `products/${cleanSlug}/${kind}/${ts}-${clean}`;
}

async function findProductByOne(oneRaw: string) {
  const one = str(oneRaw);
  if (!one) return null;

  const byId = await prisma.catalogProduct.findFirst({
    where: { id: one },
    include: { variants: true },
  });
  if (byId) return byId;

  const bySlug = await prisma.catalogProduct.findFirst({
    where: { slug: one },
    include: { variants: true },
  });
  return bySlug;
}

export async function GET(req: Request) {
  try {
    if (!authed(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const one = str(url.searchParams.get("one"));
    if (one) {
      const product = await findProductByOne(one);
      if (!product) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true, product });
    }

    const rows = await prisma.catalogProduct.findMany({
      include: { variants: true },
      orderBy: { updatedAt: "desc" },
    });

    const products = rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      active: !!(p as any).active,
      updatedAt: p.updatedAt,
      variantsCount: Array.isArray(p.variants) ? p.variants.length : 0,
      imageUrl: (p as any).imageUrl ?? null,
    }));

    return NextResponse.json({ ok: true, products });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!authed(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const fd = await req.formData();

    // ✅ id is optional (schema has @default(cuid()))
    const idRaw = str(fd.get("id"));
    const slug = str(fd.get("slug")).toLowerCase();
    const name = str(fd.get("name"));
    const category = str(fd.get("category")).toLowerCase();

    if (!slug || !name || !category) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields (slug, name, category)." },
        { status: 400 }
      );
    }

    const subcategoriesRaw = str(fd.get("subcategories"));
    const tagsRaw = str(fd.get("tags"));

    const price = asNumOrNull(fd.get("price"));
    const potency = str(fd.get("potency")) || null;
    const badge = str(fd.get("badge")) || null;
    const coaUrl = str(fd.get("coaUrl")) || null;
    const active = String(fd.get("active") ?? "true") === "true";

    const variantsJson = str(fd.get("variantsJson") || "[]");
    const variants = (() => {
      let arr: any[] = [];
      try {
        const v = JSON.parse(variantsJson);
        if (Array.isArray(v)) arr = v;
      } catch {}
      return arr
        .map((v) => ({
          id: str(v?.id),
          label: v?.label != null ? str(v.label) : null,
          grams: v?.grams != null ? Number(v.grams) : null,
          price: v?.price != null ? Number(v.price) : null,
          isPopular: !!v?.isPopular,
          initialQty: Math.max(0, Number(v?.initialQty ?? 0) || 0),
        }))
        .filter((v) => v.id.length > 0);
    })();

    const imageFile = fd.get("image");
    const galleryFiles = fd.getAll("images");

    let imageUrl: string | null = null;
    let imageUrls: string[] = [];

    if (imageFile && typeof imageFile !== "string") {
      imageUrl = await uploadToBlob(imageFile as File, blobPath("thumb", slug, (imageFile as File).name));
    } else if (typeof imageFile === "string" && imageFile.trim()) {
      imageUrl = imageFile.trim();
    }

    for (const g of galleryFiles) {
      if (!g) continue;
      if (typeof g === "string") {
        if (g.trim()) imageUrls.push(g.trim());
      } else {
        const url = await uploadToBlob(g as File, blobPath("gallery", slug, (g as File).name));
        imageUrls.push(url);
      }
    }

    if (!imageUrl && imageUrls.length) imageUrl = imageUrls[0];

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.catalogProduct.create({
        data: {
          ...(idRaw ? { id: idRaw } : {}), // ✅ only set if provided
          slug,
          name,
          category,
          subcategories: parseJsonOrCsvArray(subcategoriesRaw) as any,
          tags: parseJsonOrCsvArray(tagsRaw) as any,
          price,
          potency,
          badge,
          coaUrl,
          active,
          imageUrl,
          imageUrls,
        } as any,
      });

      if (variants.length) {
        await tx.catalogVariant.createMany({
          data: variants.map((v) => ({
            productId: product.id,
            id: v.id,
            label: v.label,
            grams: v.grams,
            price: v.price,
            isPopular: v.isPopular,
          })) as any,
          skipDuplicates: true,
        });
      }

      if (variants.length) {
        await tx.inventory.createMany({
          data: variants.map((v) => ({
            productId: product.id,
            variant: v.id,
            qty: v.initialQty,
          })) as any,
          skipDuplicates: true,
        });
      } else {
        await tx.inventory.createMany({
          data: [{ productId: product.id, variant: null, qty: 0 }] as any,
          skipDuplicates: true,
        });
      }

      return product;
    });

    return NextResponse.json({ ok: true, created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error creating product" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!authed(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const fd = await req.formData();
    const one = str(fd.get("one"));

    if (!one) {
      return NextResponse.json({ ok: false, error: "Missing 'one' (id or slug)." }, { status: 400 });
    }

    const existing = await findProductByOne(one);
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const slug = str(fd.get("slug")).toLowerCase();
    const name = str(fd.get("name"));
    const category = str(fd.get("category")).toLowerCase();

    if (!slug || !name || !category) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields (slug, name, category)." },
        { status: 400 }
      );
    }

    const subcategoriesRaw = str(fd.get("subcategories"));
    const tagsRaw = str(fd.get("tags"));

    const price = asNumOrNull(fd.get("price"));
    const potency = str(fd.get("potency")) || null;
    const badge = str(fd.get("badge")) || null;
    const coaUrl = str(fd.get("coaUrl")) || null;
    const active = String(fd.get("active") ?? "true") === "true";

    const variantsJson = str(fd.get("variantsJson") || "[]");
    let variantDrafts: any[] = [];
    try {
      const v = JSON.parse(variantsJson);
      if (Array.isArray(v)) variantDrafts = v;
    } catch {}

    const nextVariants = variantDrafts
      .map((v) => ({
        id: str(v?.id),
        label: v?.label != null ? str(v.label) : null,
        grams: v?.grams != null ? Number(v.grams) : null,
        price: v?.price != null ? Number(v.price) : null,
        isPopular: !!v?.isPopular,
      }))
      .filter((v) => v.id.length > 0);

    const imageFile = fd.get("image");
    const galleryFiles = fd.getAll("images");

    let nextImageUrl: string | null = (existing as any).imageUrl ?? null;
    let nextImageUrls: string[] = Array.isArray((existing as any).imageUrls) ? (existing as any).imageUrls : [];

    if (imageFile && typeof imageFile !== "string") {
      nextImageUrl = await uploadToBlob(imageFile as File, blobPath("thumb", slug, (imageFile as File).name));
    } else if (typeof imageFile === "string" && imageFile.trim()) {
      nextImageUrl = imageFile.trim();
    }

    const newlyUploaded: string[] = [];
    for (const g of galleryFiles) {
      if (!g) continue;
      if (typeof g === "string") {
        if (g.trim()) newlyUploaded.push(g.trim());
      } else {
        const url = await uploadToBlob(g as File, blobPath("gallery", slug, (g as File).name));
        newlyUploaded.push(url);
      }
    }
    if (newlyUploaded.length) nextImageUrls = [...nextImageUrls, ...newlyUploaded];

    if (!nextImageUrl && nextImageUrls.length) nextImageUrl = nextImageUrls[0];

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.catalogProduct.update({
        where: { id: existing.id },
        data: {
          slug,
          name,
          category,
          subcategories: parseJsonOrCsvArray(subcategoriesRaw) as any,
          tags: parseJsonOrCsvArray(tagsRaw) as any,
          price,
          potency,
          badge,
          coaUrl,
          active,
          imageUrl: nextImageUrl,
          imageUrls: nextImageUrls,
        } as any,
        include: { variants: true },
      });

      await tx.catalogVariant.deleteMany({ where: { productId: product.id } });

      if (nextVariants.length) {
        await tx.catalogVariant.createMany({
          data: nextVariants.map((v) => ({
            productId: product.id,
            id: v.id,
            label: v.label,
            grams: v.grams,
            price: v.price,
            isPopular: v.isPopular,
          })) as any,
          skipDuplicates: true,
        });

        await tx.inventory.createMany({
          data: nextVariants.map((v) => ({
            productId: product.id,
            variant: v.id,
            qty: 0,
          })) as any,
          skipDuplicates: true,
        });
      } else {
        await tx.inventory.createMany({
          data: [{ productId: product.id, variant: null, qty: 0 }] as any,
          skipDuplicates: true,
        });
      }

      return product;
    });

    return NextResponse.json({ ok: true, updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Save failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!authed(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const one = str(url.searchParams.get("one"));

    if (!one) {
      return NextResponse.json({ ok: false, error: "Missing 'one' (id or slug)." }, { status: 400 });
    }

    const existing = await findProductByOne(one);
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.inventory.deleteMany({ where: { productId: existing.id } });
      await tx.catalogVariant.deleteMany({ where: { productId: existing.id } });
      await tx.catalogProduct.delete({ where: { id: existing.id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Delete failed" }, { status: 500 });
  }
}
