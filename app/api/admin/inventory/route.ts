// app/api/admin/inventory/route.ts
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { getCatalogProducts } from "@/lib/catalog.server";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function toHttpStatus(e: any) {
  const msg = String(e?.message || "");
  if (msg === "UNAUTHORIZED") return 401;
  if (msg === "FORBIDDEN") return 403;
  return 500;
}

function canon(v: string | null | undefined) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function normalizeImageUrl(input: any): string | null {
  if (!input) return null;

  if (typeof input === "object" && typeof input.src === "string") {
    input = input.src;
  }

  if (typeof input !== "string") return null;

  let s = input.trim();
  if (!s) return null;

  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) return s;

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
    (Array.isArray(p?.gallery) ? p.gallery[0] : null) ||
    (Array.isArray(p?.imageUrls) ? p.imageUrls[0] : null);

  return normalizeImageUrl(direct);
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

async function upsertInventoryQty(productId: string, variant: string | null, qty: number) {
  const existing = await prisma.inventory.findFirst({
    where: { productId, variant },
    select: { id: true, qty: true },
  });

  if (existing?.id) {
    await prisma.inventory.update({
      where: { id: existing.id },
      data: { qty },
    });
    return { prevQty: existing.qty, nextQty: qty, created: false };
  }

  const created = await prisma.inventory.create({
    data: { productId, variant, qty },
    select: { qty: true },
  });

  return { prevQty: 0, nextQty: created.qty, created: true };
}

function emailFromEnv() {
  return process.env.RESEND_FROM || process.env.EMAIL_FROM || "Leaflyx <onboarding@resend.dev>";
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";
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
        from: emailFromEnv(),
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

  let deleted = 0;
  if (sentIds.length) {
    const del = await prisma.backInStockRequest.deleteMany({
      where: { id: { in: sentIds } },
    });
    deleted = del.count;
  }

  return { matched: matched.length, emailed, sendErrors, deleted };
}

// --- Row creation helpers ---
function desiredVariantsForProduct(p: any): Array<{ id: string | null; label: string | null }> {
  return Array.isArray(p?.variants) && p.variants.length
    ? p.variants.map((v: any) => ({
        id: canon(v?.id),
        label: v?.label ? String(v.label) : null,
      }))
    : [{ id: null, label: null }];
}

async function createMissingRowsForCatalog(catalog: any[], onlyProductId?: string) {
  const list = onlyProductId
    ? catalog.filter((pp) => String(pp?.id).toLowerCase() === String(onlyProductId).toLowerCase())
    : catalog;

  if (onlyProductId && !list.length) {
    return { created: 0, scannedProducts: 0, reason: "Product not found in catalog" as const };
  }

  let created = 0;

  for (const pp of list as any[]) {
    const pid = String(pp.id);
    const vars: Array<string | null> = desiredVariantsForProduct(pp).map((v) => v.id);

    for (const v of vars) {
      const exists = await prisma.inventory.findFirst({
        where: { productId: pid, variant: v },
        select: { id: true },
      });

      if (!exists) {
        await prisma.inventory.create({ data: { productId: pid, variant: v, qty: 0 } });
        created += 1;
      }
    }
  }

  return { created, scannedProducts: list.length, reason: null };
}

export async function GET(_req: Request) {
  try {
    await assertAdmin();

    const catalog = await getCatalogProducts();

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

    const rows: any[] = [];

    for (const p of catalog as any[]) {
      const productId = String(p.id);
      const productName = String(p.name ?? p.title ?? productId);
      const slug = p.slug ? String(p.slug) : null;

      const category = pickCategory(p);
      const image = pickImage(p);

      const variants = desiredVariantsForProduct(p);

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
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed" }, { status: toHttpStatus(e) });
  }
}

export async function POST(req: Request) {
  try {
    await assertAdmin();

    const catalog = await getCatalogProducts();
    const body = await req.json().catch(() => ({} as any));

    const actionRaw = String(body?.action ?? "");
    const action = actionRaw.trim();

    // Backwards/forwards compatible aliases
    const isEnsureAll =
      action === "createMissing" || action === "ensureAllRows" || action === "ensureRowsAll";
    const isEnsureOne =
      action === "createOne" || action === "ensureProductRows" || action === "ensureRowsOne";

    if (isEnsureAll) {
      const res = await createMissingRowsForCatalog(catalog as any[]);
      return NextResponse.json({ ok: true, created: res.created, scannedProducts: res.scannedProducts });
    }

    if (isEnsureOne) {
      const productId = String(body?.productId ?? "").trim();
      if (!productId) {
        return NextResponse.json({ ok: false, error: "Missing productId" }, { status: 400 });
      }

      const res = await createMissingRowsForCatalog(catalog as any[], productId);
      if (res.reason) {
        return NextResponse.json({ ok: false, error: res.reason }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        productId,
        created: res.created,
        scannedProducts: res.scannedProducts,
      });
    }

    // From here down, productId is required
    const productId = String(body?.productId ?? "").trim();
    const variant = canon(body?.variant);

    if (!productId) {
      return NextResponse.json({ ok: false, error: "Missing productId" }, { status: 400 });
    }

    const p = (catalog as any[]).find((x) => String(x?.id).toLowerCase() === productId.toLowerCase());

    const productName = p?.name ? String(p.name) : productId;
    const slug = p?.slug ? String(p.slug) : null;
    const variantLabel = variantLabelFromProduct(p, variant);

    if (action === "setQty") {
      const qty = Number(body?.qty);
      if (!Number.isFinite(qty) || qty < 0) {
        return NextResponse.json({ ok: false, error: "Invalid qty" }, { status: 400 });
      }

      const prev = await prisma.inventory.findFirst({
        where: { productId, variant },
        select: { qty: true },
      });

      const prevQty = prev?.qty ?? 0;

      await upsertInventoryQty(productId, variant, qty);

      const nextQty = qty;

      let matched = 0;
      let emailed = 0;
      let sendErrors = 0;
      let deleted = 0;

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
      const prev = await prisma.inventory.findFirst({
        where: { productId, variant },
        select: { qty: true },
      });

      const prevQty = prev?.qty ?? 0;

      await upsertInventoryQty(productId, variant, 0);

      return NextResponse.json({ ok: true, productId, variant, prevQty, nextQty: 0 });
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

    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed" }, { status: toHttpStatus(e) });
  }
}
