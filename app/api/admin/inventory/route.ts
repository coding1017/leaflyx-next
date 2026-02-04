// app/api/admin/inventory/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { products } from "@/lib/products";

const resend = new Resend(process.env.RESEND_API_KEY);

function requireAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

function canon(v: string | null | undefined) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function pickCategory(p: any): string | null {
  if (p?.category) return String(p.category);

  const tags: string[] = Array.isArray(p?.tags) ? p.tags.map(String) : [];
  const known = [
    "flower",
    "smalls",
    "edibles",
    "vapes",
    "beverages",
    "pre-rolls",
    "concentrates",
    "merch",
    "misc",
  ];
  const hit = tags.find((t) => known.includes(String(t).toLowerCase()));
  if (!hit) return null;

  return hit
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Admin page reads this data from JSON over HTTP.
 * next/image cannot use StaticImageData objects coming through JSON,
 * so we normalize any "imported image object" into a string URL.
 */
function normalizeImageUrl(input: any): string | null {
  if (!input) return null;

  // If it's StaticImageData-like: { src: "/_next/static/media/..." }
  if (typeof input === "object" && typeof input.src === "string") {
    input = input.src;
  }

  if (typeof input !== "string") return null;

  let s = input.trim();
  if (!s) return null;

  // absolute urls ok
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // data urls ok (optional)
  if (s.startsWith("data:")) return s;

  // ensure leading slash for relative assets
  if (!s.startsWith("/")) s = "/" + s;

  return s;
}

function pickImage(p: any): string | null {
  const direct =
    p?.image ||
    p?.imageUrl ||
    p?.thumbnail ||
    p?.thumb ||
    (Array.isArray(p?.images) ? p.images[0] : null) ||
    (Array.isArray(p?.gallery) ? p.gallery[0] : null);

  return normalizeImageUrl(direct);
}

function variantLabelFromProduct(p: any, variantId: string | null) {
  if (!variantId) return null;
  const v = Array.isArray(p?.variants)
    ? p.variants.find((x: any) => String(x?.id).trim() === variantId)
    : null;
  const label = v?.label ? String(v.label) : null;
  return label && label.trim().length ? label : null;
}

function buildProductHref(slug: string | null, variant: string | null) {
  if (!slug) return null;
  const base = `/shop/${slug}`;
  if (!variant) return base;
  return `${base}?variant=${encodeURIComponent(variant)}`;
}

function prettyVariant(variant: string | null, variantLabel: string | null) {
  const v = (variantLabel ?? variant ?? "").trim();
  return v || null;
}

async function sendRestockEmails(args: {
  productId: string;
  variant: string | null;
  productName: string;
  slug: string | null;
  variantLabel: string | null;
}) {
  const { productId, variant, productName, slug, variantLabel } = args;

  const matched = await prisma.backInStockRequest.findMany({
    where: { productId, variant },
    select: { id: true, email: true },
  });

  if (!matched.length) {
    return { matched: 0, emailed: 0, sendErrors: 0, deleted: 0 };
  }

  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  const href = buildProductHref(slug, variant) ?? "/shop";
  const url = `${siteUrl}${href}`;

  const vPretty = prettyVariant(variant, variantLabel);
  const subject = vPretty
    ? `Leaflyx Restock — ${productName} (${vPretty}) is back in stock`
    : `Leaflyx Restock — ${productName} is back in stock`;

  let emailed = 0;
  let sendErrors = 0;
  const sentIds: string[] = [];

  for (const m of matched) {
    try {
      await resend.emails.send({
        from:
  process.env.RESEND_FROM ||
  process.env.EMAIL_FROM ||
  "Leaflyx <onboarding@resend.dev>",
        to: m.email,
        subject,
        html: `
          <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.35; color: #111;">
            <h2 style="margin:0 0 12px;">Back in stock</h2>
            <p style="margin:0 0 14px;">
              <strong>${productName}</strong>${vPretty ? ` (${vPretty})` : ""} is available again.
            </p>
            <p style="margin:0 0 18px;">
              <a href="${url}" style="display:inline-block; background:#d6b44c; color:#111; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:600;">
                View product
              </a>
            </p>
            <p style="margin:0; color:#555; font-size:12px;">
              You requested a restock alert from Leaflyx.
            </p>
          </div>
        `,
      });

      emailed += 1;
      sentIds.push(m.id);
    } catch (err: any) {
      sendErrors += 1;
      console.error("[restock-send] Resend error:", err);
    }
  }

  // Clean up ONLY successfully emailed rows
  let deleted = 0;
  if (sentIds.length) {
    const del = await prisma.backInStockRequest.deleteMany({
      where: { id: { in: sentIds } },
    });
    deleted = del.count;
  }

  return { matched: matched.length, emailed, sendErrors, deleted };
}

export async function GET(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const inv = await prisma.inventory.findMany({
      select: { productId: true, variant: true, qty: true, updatedAt: true },
    });

    const subs = await prisma.backInStockRequest.groupBy({
      by: ["productId", "variant"],
      _count: { _all: true },
    });

    const subsMap = new Map<string, number>();
    for (const s of subs) {
      const key = `${s.productId}__${canon(s.variant) ?? "∅"}`;
      subsMap.set(key, s._count._all);
    }

    const invMap = new Map<string, { qty: number; updatedAt: Date }>();
    for (const r of inv) {
      const key = `${r.productId}__${canon(r.variant) ?? "∅"}`;
      invMap.set(key, { qty: r.qty, updatedAt: r.updatedAt });
    }

    // Catalog-driven list so ALL products show (with placeholders)
    const rows: any[] = [];

    for (const p of products as any[]) {
      const productId = String(p.id);
      const productName = String(p.name ?? p.title ?? productId);
      const slug = p.slug ? String(p.slug) : null;

      const category = pickCategory(p);
      const image = pickImage(p);

      const variants: Array<{ id: string | null; label: string | null }> =
        Array.isArray(p.variants) && p.variants.length
          ? p.variants.map((v: any) => ({
              id: canon(v?.id),
              label: v?.label ? String(v.label) : null,
            }))
          : [{ id: null, label: null }];

      for (const v of variants) {
        const variant = v.id;
        const key = `${productId}__${variant ?? "∅"}`;

        const invRow = invMap.get(key);
        const qty = invRow?.qty ?? 0;
        const updatedAt = invRow?.updatedAt ?? new Date(0);

        const subscribers = subsMap.get(key) ?? 0;
        const variantLabel = v.label ?? variantLabelFromProduct(p, variant);

        rows.push({
          productId,
          productName,
          slug,
          variant,
          variantLabel,
          qty,
          updatedAt: updatedAt.toISOString(),
          subscribers,

          category,
          image,

          missingInventory: !invRow,
        });
      }
    }

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const action = String(body?.action ?? "");
    const productId = String(body?.productId ?? "").trim();
    const variant = canon(body?.variant);

    if (!productId) {
      return NextResponse.json({ ok: false, error: "Missing productId" }, { status: 400 });
    }

    // Product meta for better emails + correct link
    const p = (products as any[]).find(
      (x) => String(x?.id).toLowerCase() === productId.toLowerCase()
    );

    const productName = p?.name ? String(p.name) : productId;
    const slug = p?.slug ? String(p.slug) : null;
    const variantLabel = variantLabelFromProduct(p, variant);

    if (action === "createMissing") {
      let created = 0;

      for (const pp of products as any[]) {
        const pid = String(pp.id);

        const vars: Array<string | null> =
          Array.isArray(pp.variants) && pp.variants.length
            ? pp.variants.map((v: any) => canon(v?.id))
            : [null];

        for (const v of vars) {
          const exists = await prisma.inventory.findFirst({
            where: { productId: pid, variant: v },
            select: { id: true },
          });

          if (!exists) {
            await prisma.inventory.create({
              data: { productId: pid, variant: v, qty: 0 },
            });
            created += 1;
          }
        }
      }

      return NextResponse.json({ ok: true, created });
    }

    if (action === "setQty") {
      const qty = Number(body?.qty);
      if (!Number.isFinite(qty) || qty < 0) {
        return NextResponse.json({ ok: false, error: "Invalid qty" }, { status: 400 });
      }

      const existing = await prisma.inventory.findFirst({
        where: { productId, variant },
        select: { id: true, qty: true },
      });

      const prevQty = existing?.qty ?? 0;

      await prisma.inventory.upsert({
        where: existing?.id ? { id: existing.id } : { id: "__never__" },
        update: { qty },
        create: { productId, variant, qty },
      });

      const nextQty = qty;

      let matched = 0;
      let emailed = 0;
      let sendErrors = 0;
      let deleted = 0;

      // auto-send only on 0 -> >0
      if (prevQty <= 0 && nextQty > 0) {
        const sent = await sendRestockEmails({
          productId,
          variant,
          productName,
          slug,
          variantLabel,
        });
        matched = sent.matched;
        emailed = sent.emailed;
        sendErrors = sent.sendErrors;
        deleted = sent.deleted;
      }

      return NextResponse.json({
        ok: true,
        productId,
        variant,
        prevQty,
        nextQty,
        matched,
        emailed,
        sendErrors,
        deleted,
      });
    }

    if (action === "resetQty") {
      const existing = await prisma.inventory.findFirst({
        where: { productId, variant },
        select: { id: true, qty: true },
      });

      const prevQty = existing?.qty ?? 0;

      await prisma.inventory.upsert({
        where: existing?.id ? { id: existing.id } : { id: "__never__" },
        update: { qty: 0 },
        create: { productId, variant, qty: 0 },
      });

      return NextResponse.json({
        ok: true,
        productId,
        variant,
        prevQty,
        nextQty: 0,
      });
    }

    if (action === "notify") {
      const sent = await sendRestockEmails({
        productId,
        variant,
        productName,
        slug,
        variantLabel,
      });

      return NextResponse.json({
        ok: true,
        productId,
        variant,
        matched: sent.matched,
        emailed: sent.emailed,
        sendErrors: sent.sendErrors,
        deleted: sent.deleted,
      });
    }

    return NextResponse.json(
      { ok: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}
