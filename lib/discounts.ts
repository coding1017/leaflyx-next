// lib/discounts.ts
export type CartItemSnap = {
  id: string;
  name: string;
  variant?: string | null;
  priceCents: number;
  qty: number;
};

export type DiscountRow = {
  code: string;
  type: "PERCENT" | "AMOUNT";
  percentOff?: number | null;
  amountOffCents?: number | null;
  minSubtotalCents?: number | null;
};

function toInt(n: unknown, fallback = 0) {
  const x =
    typeof n === "number" ? n : typeof n === "string" ? Number(n) : fallback;
  if (!Number.isFinite(x)) return fallback;
  return Math.round(x);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function clampDiscountCents(args: {
  subtotalCents: number;
  discount: DiscountRow;
}): { discountCents: number; reason?: string } {
  const subtotalCents = toInt(args.subtotalCents, 0);
  const discount = args.discount;

  if (subtotalCents <= 0) return { discountCents: 0, reason: "empty_cart" };

  const minSubtotal = discount.minSubtotalCents != null ? toInt(discount.minSubtotalCents, 0) : 0;
  if (minSubtotal > 0 && subtotalCents < minSubtotal) {
    return { discountCents: 0, reason: "min_subtotal" };
  }

  // ✅ hard cap: 50% of subtotal
  const maxAllowed = Math.floor(subtotalCents * 0.5);

  let raw = 0;

  if (discount.type === "PERCENT") {
    const pct = clamp(toInt(discount.percentOff ?? 0, 0), 0, 50);
    raw = Math.floor((subtotalCents * pct) / 100);
  } else {
    raw = Math.max(0, toInt(discount.amountOffCents ?? 0, 0));
  }

  const discountCents = clamp(raw, 0, Math.min(maxAllowed, subtotalCents));
  if (discountCents <= 0) return { discountCents: 0, reason: "no_discount" };

  return { discountCents };
}
