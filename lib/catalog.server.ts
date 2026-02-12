// lib/catalog.server.ts
import { prisma } from "@/lib/prisma";
import { products as staticProducts } from "@/lib/products";

type AnyProduct = any;

function normalizeDbProductToCatalogShape(p: any): AnyProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    subcategories: Array.isArray(p.subcategories) ? p.subcategories : (p.subcategories ?? []),
    tags: Array.isArray(p.tags) ? p.tags : (p.tags ?? []),
    price: p.price ?? null,
    potency: p.potency ?? null,
    badge: p.badge ?? null,
    coaUrl: p.coaUrl ?? null,
    active: !!p.active,
    // IMPORTANT: your admin/inventory API already normalizes image objects → string
    image: p.imageUrl ?? null,
    images: Array.isArray(p.imageUrls) ? p.imageUrls : (p.imageUrls ?? []),
    variants: (p.variants ?? []).map((v: any) => ({
      id: v.id,
      label: v.label ?? v.id,
      grams: v.grams ?? null,
      price: v.price ?? null,
      isPopular: !!v.isPopular,
      // stock is handled by Prisma Inventory overlay, not here
    })),
  };
}

export async function getCatalogProducts() {
  const db = await prisma.catalogProduct.findMany({
    include: { variants: true },
    orderBy: { name: "asc" },
  });

  const dbProducts = db.map(normalizeDbProductToCatalogShape);

  // Avoid accidental id collisions: DB product should override static if same id
  const map = new Map<string, AnyProduct>();
  for (const p of staticProducts as AnyProduct[]) map.set(String(p.id), p);
  for (const p of dbProducts) map.set(String(p.id), p);

  return Array.from(map.values());
}
