// app/api/inventory/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import * as ProductMeta from "@/lib/products";

const resend = new Resend(process.env.RESEND_API_KEY);

function json(status: number, data: any) {
  return NextResponse.json(data, { status });
}

function requireAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

function normalizeVariant(input: unknown): string | null {
  if (input === null || input === undefined) return null;
  let s = String(input).trim();
  if (!s) return null;

  const paren = s.match(/\(([^)]+)\)/);
  if (paren?.[1]) s = paren[1].trim();

  s = s.replace(/\s+/g, "").toLowerCase();
  return s || null;
}

function splitLegacyProductId(pid: string): { productId: string; variantFromPid: string | null } {
  const p = pid.trim();
  const idx = p.indexOf(":");
  if (idx <= 0) return { productId: p, variantFromPid: null };
  return {
    productId: p.slice(0, idx),
    variantFromPid: p.slice(idx + 1).trim() || null,
  };
}

function resolveProductFromId(pid: string) {
  const key = String(pid || "").toLowerCase();
  const byId = (ProductMeta as any).PRODUCTS_BY_ID?.[key];
  if (byId) return byId;

  const list = (ProductMeta as any).products || (ProductMeta as any).default || [];
  if (Array.isArray(list)) {
    return list.find((p: any) => String(p.id).toLowerCase() === key);
  }

  return null;
}

function getVariantLabel(product: any, variantId: string | null) {
  if (!product || !variantId) return null;
  const v = String(variantId).toLowerCase();
  const match = Array.isArray(product.variants)
    ? product.variants.find((x: any) => String(x.id).toLowerCase() === v)
    : null;
  return match?.label ? String(match.label) : variantId;
}

// ✅ IMPORTANT: your actual product route is /shop/p/[slug]
function buildProductUrl(site: string, product: any, pid: string, variantId: string | null) {
  const slug = product?.slug ? String(product.slug) : null;
  const base = `${site}/shop/p/${encodeURIComponent(slug || pid)}`;
  if (variantId) return `${base}?variant=${encodeURIComponent(variantId)}`;
  return base;
}

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return json(401, { ok: false, error: "Unauthorized" });
    }

    const body = await req.json().catch(() => null);
    if (!body) return json(400, { ok: false, error: "Invalid JSON body" });

    const rawPid = String(body.productId ?? "").trim();
    const rawVariant = body.variant;
    const qtyNum = Number(body.qty);

    if (!rawPid || Number.isNaN(qtyNum) || qtyNum < 0) {
      return json(400, { ok: false, error: "Invalid payload" });
    }

    const { productId: basePid, variantFromPid } = splitLegacyProductId(rawPid);
    const pid = basePid.trim().toLowerCase();
    const v = normalizeVariant(rawVariant) ?? normalizeVariant(variantFromPid);
    const q = Math.floor(qtyNum);

    console.log("[inventory]", { pid, v, q, rawPid, rawVariant });

    const prev = await prisma.inventory.findFirst({
      where: { productId: pid, variant: v },
      select: { qty: true },
    });
    const prevQty = prev?.qty ?? 0;

    const next = await prisma.$transaction(async (tx) => {
      const updated = await tx.inventory.updateMany({
        where: { productId: pid, variant: v },
        data: { qty: q },
      });

      if (updated.count > 0) {
        const row = await tx.inventory.findFirst({ where: { productId: pid, variant: v } });
        if (!row) throw new Error("Inventory row missing after update");
        return row;
      }

      return tx.inventory.create({ data: { productId: pid, variant: v, qty: q } });
    });

    let matched = 0;
    let emailed = 0;
    let sendErrors = 0;

    if (prevQty <= 0 && next.qty > 0) {
      const legacyKey = v ? `${pid}:${v}` : null;

      const requests = await prisma.backInStockRequest.findMany({
        where: {
          OR: [
            {
              productId: pid,
              OR: [{ variant: null }, ...(v ? [{ variant: v }] : [])],
            },
            ...(legacyKey ? [{ productId: legacyKey }] : []),
          ],
        },
      });

      matched = requests.length;
      console.log("[restock-match]", { pid, v, prevQty, nextQty: next.qty, matched, legacyKey });

      if (matched > 0) {
        const from = process.env.RESEND_FROM;
        const site = process.env.SITE_URL || "http://localhost:3000";

        if (!from) {
          console.error("Missing RESEND_FROM in env. Skipping send.");
          sendErrors = matched;
        } else if (!process.env.RESEND_API_KEY) {
          console.error("Missing RESEND_API_KEY in env. Skipping send.");
          sendErrors = matched;
        } else {
          const product = resolveProductFromId(pid);
          const productName = product?.name ? String(product.name) : `Product ${pid.toUpperCase()}`;
          const prettyVariant = getVariantLabel(product, v);
          const productUrl = buildProductUrl(site, product, pid, v);

          for (const r of requests) {
            let displayVariant = r.variant ?? null;
            if (!displayVariant && typeof r.productId === "string" && r.productId.includes(":")) {
              const after = r.productId.split(":")[1]?.trim();
              displayVariant = after || null;
            }

            const variantLabelForEmail = prettyVariant ?? (displayVariant ? String(displayVariant) : null);

            const subject = variantLabelForEmail
              ? `Leaflyx Restock — ${productName} (${variantLabelForEmail}) is back in stock`
              : `Leaflyx Restock — ${productName} is back in stock`;

            try {
              const resp = await resend.emails.send({
                from,
                to: [r.email],
                subject,
                html: `
                  <div style="font-family:system-ui;padding:24px;line-height:1.45">
                    <h2 style="margin:0 0 10px 0;color:#d4af37">Back in stock</h2>

                    <p style="margin:0 0 10px 0">
                      <strong>${productName}</strong>${
                        variantLabelForEmail ? ` <span style="opacity:.75">(${variantLabelForEmail})</span>` : ""
                      } is available again.
                    </p>

                    <p style="margin:0 0 14px 0;opacity:.85">
                      You’re receiving this because you requested a restock alert for this item.
                    </p>

                    <p style="margin:18px 0">
                      <a href="${productUrl}"
                        style="background:#d4af37;color:#111;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:700;">
                        View ${productName}
                      </a>
                    </p>

                    <p style="margin-top:18px;font-size:12px;opacity:.65">
                      Leaflyx • Premium THCA goods
                    </p>
                  </div>
                `,
              });

              if ((resp as any)?.error) {
                sendErrors += 1;
                console.error("[restock-send] Resend error:", (resp as any).error);
              } else {
                emailed += 1;
                console.log("[restock-send] sent", { to: r.email, pid, v, productUrl });
              }
            } catch (e) {
              sendErrors += 1;
              console.error("[restock-send] send() threw:", e);
            }
          }

          if (emailed > 0) {
            await prisma.backInStockRequest.deleteMany({
              where: { id: { in: requests.map((r) => r.id) } },
            });
          }
        }
      }
    }

    return json(200, {
      ok: true,
      productId: pid,
      variant: v,
      prevQty,
      nextQty: next.qty,
      matched,
      emailed,
      sendErrors,
    });
  } catch (err) {
    console.error(err);
    return json(500, { ok: false, error: "Server error" });
  }
}
