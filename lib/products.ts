// lib/products.ts

/**
 * IMPORTANT (Vercel-safe):
 * ✅ Do NOT import images from /public as modules (e.g. "@/public/...")
 * ✅ Use string paths that map to files inside /public
 *    Example: public/images/products/foo.jpg  ->  "/images/products/foo.jpg"
 *
 * This avoids Linux/Vercel webpack "Module not found" errors.
 */

export type Variant = {
  id: string; // "1g", "3.5g"
  label: string; // "1 g", "3.5 g"
  grams: number; // 1, 3.5, etc
  price: number; // price for this size (DOLLARS)
  isPopular?: boolean;
  stock?: number; // units for this size; 0 = sold out
};

// ✅ images are ALWAYS string public URLs
export type ProductImage = string;

export type Product = {
  id: string;
  slug: string;
  name: string;
  category:
    | "Flower"
    | "Vapes"
    | "Edibles"
    | "Beverages"
    | "Pre-Rolls"
    | "Concentrates"
    | "Smalls"
    | "Merch"
    | "Misc";
  /** stackable filtering facets like "indoor", "organic", "cookies", "gummies", etc. */
  subcategories?: string[];
  price: number;
  potency: string;
  image: ProductImage;
  images?: ProductImage[];
  badge?: string;
  coaUrl?: string;
  variants?: Variant[];
  stock?: number;
  active?: boolean;
};

/* =========================
   Image paths (public URLs)
   ========================= */

const IMG = {
  // Flower / Smalls / Shared
  iceCreamCake1: "/images/products/ice-cream-cake-1.jpg",
  chocolateMintz: "/images/products/chocolate-mintz.png",
  cherryLemonade06: "/images/products/cherry-lemonade-06.jpg",
  weddingCake: "/images/products/wedding-cake.png",
  modifiedGrapes: "/images/products/modified-grapes.png",

  jellysBreath: "/images/products/jellys-breath.jpg",
  jellysBreath2: "/images/products/jellys-breath2.jpg",
  jellysBreath3: "/images/products/jellys-breath3.jpg",

  butterface: "/images/products/butterface.jpg",
  butterface2: "/images/products/butterface2.jpg",
  butterface3: "/images/products/butterface3.jpg",

  mimosa: "/images/products/mimosa.jpg",
  mimosa2: "/images/products/mimosa2.jpg",
  mimosa3: "/images/products/mimosa3.jpg",

  // Edibles
  brownButterBliss: "/images/products/brown-butter-bliss.jpg",
  brownButterBliss2: "/images/products/brown-butter-bliss2.jpg",

  peppermintBrownie: "/images/products/peppermint-brownie.jpg",
  peppermintBrownie2: "/images/products/peppermint-brownie2.jpg",
  peppermintBrownie3: "/images/products/peppermint-brownie3.jpg",
  peppermintBrownie4: "/images/products/peppermint-brownie4.jpg",

  stoutBrownie: "/images/products/stout-brownie.jpg",
  stoutBrownie2: "/images/products/stout-brownie2.jpg",
  stoutBrownie3: "/images/products/stout-brownie3.jpg",
  stoutBrownie4: "/images/products/stout-brownie4.jpg",

  fruitSyrupRasberry: "/images/products/fruit-syrup-rasberry.jpg",
  fruitSyrupRasberry2: "/images/products/fruit-syrup-rasberry2.jpg",
  fruitSyrupRasberry3: "/images/products/fruit-syrup-rasberry3.jpg",

  honeyHibiscus: "/images/products/honey-hibiscus.jpg",
  honeyHibiscus2: "/images/products/honey-hibiscus2.jpg",
  honeyHibiscus3: "/images/products/honey-hibiscus3.jpg",

  berryFruitGummy: "/images/products/berry-fruit-gummy.jpg",
  berryFruitGummy2: "/images/products/berry-fruit-gummy2.jpg",
  berryFruitGummy3: "/images/products/berry-fruit-gummy3.jpg",

  chocolateBrownie: "/images/products/chocolate-brownie.jpg",
  chocolateBrownie2: "/images/products/chocolate-brownie2.jpg",
  chocolateBrownie3: "/images/products/chocolate-brownie3.jpg",

  frenchVanilla: "/images/products/french-vanilla.jpg",
  frenchVanilla2: "/images/products/french-vanilla2.jpg",
  frenchVanilla3: "/images/products/french-vanilla3.jpg",
  frenchVanilla4: "/images/products/french-vanilla4.jpg",

  sourPineapple: "/images/products/sour-pineapple-fruit-gummy.jpg",
  sourPineapple2: "/images/products/sour-pineapple-fruit-gummy2.jpg",
  sourPineapple3: "/images/products/sour-pineapple-fruit-gummy3.jpg",
  sourPineapple4: "/images/products/sour-pineapple-fruit-gummy4.jpg",

  muddyBuddy: "/images/products/muddy-buddy.jpg",
  muddyBuddy2: "/images/products/muddy-buddy2.jpg",
  muddyBuddy3: "/images/products/muddy-buddy3.jpg",
  muddyBuddy4: "/images/products/muddy-buddy4.jpg",

  // Concentrates
  danteInferno: "/images/products/dante-inferno.jpg",
  danteInferno2: "/images/products/dante-inferno2.jpg",

  blackIce: "/images/products/black-ice.jpg",
  blackIce2: "/images/products/black-ice2.jpg",

  brickleberry: "/images/products/brickleberry.jpg",
  brickleberry2: "/images/products/brickleberry2.jpg",
  brickleberry3: "/images/products/brickleberry3.jpg",
  brickleberry4: "/images/products/brickleberry4.jpg",
  brickleberry5: "/images/products/brickleberry5.jpg",
  brickleberry6: "/images/products/brickleberry6.jpg",
  brickleberry7: "/images/products/brickleberry7.jpg",

  feijoa: "/images/products/feijoa.jpg",
  feijoa2: "/images/products/feijoa2.jpg",
  feijoa3: "/images/products/feijoa3.jpg",
  feijoa4: "/images/products/feijoa4.jpg",
  feijoa5: "/images/products/feijoa5.jpg",
  feijoa6: "/images/products/feijoa6.jpg",
  feijoa7: "/images/products/feijoa7.jpg",

  honeyDonut: "/images/products/honey-donut.jpg",
  honeyDonut2: "/images/products/honey-donut2.jpg",
  honeyDonut3: "/images/products/honey-donut3.jpg",
  honeyDonut4: "/images/products/honey-donut4.jpg",
  honeyDonut5: "/images/products/honey-donut5.jpg",
  honeyDonut6: "/images/products/honey-donut6.jpg",
  honeyDonut7: "/images/products/honey-donut7.jpg",

  papayaJuice: "/images/products/papaya-juice.jpg",
  papayaJuice2: "/images/products/papaya-juice2.jpg",
  papayaJuice3: "/images/products/papaya-juice3.jpg",
} as const;

/* =========================
   Data
   ========================= */

export const products: Product[] = [
  // ------- Flower (per-variant stock) -------
  {
    id: "fl-01",
    slug: "indoor-thca-flower-ice-cream-cake",
    name: "Indoor Flower — Ice Cream Cake",
    category: "Flower",
    subcategories: ["indoor"],
    price: 35,
    potency: "26% THCA",
    image: IMG.iceCreamCake1,
    images: [IMG.iceCreamCake1],
    badge: "Bestseller",
    coaUrl: "/coas/ice-cream-cake.pdf",
    variants: [
      { id: "1g", label: "1 g", grams: 1, price: 12, stock: 10 },
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },
  {
    id: "fl-02",
    slug: "exotic-thca-flower-chocolate-mintz",
    name: "Exotic Flower — Chocolate Mintz",
    category: "Flower",
    subcategories: ["indoor", "exotic", "small-batch"],
    price: 40.0,
    potency: "28% THCA",
    image: IMG.chocolateMintz,
    badge: "Small Batch",
    coaUrl: "/coas/chocolate-mintz.pdf",
    variants: [
      { id: "1g", label: "1 g", grams: 1, price: 12, stock: 10 },
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },
  {
    id: "fl-03",
    slug: "exotic-thca-flower-cherry-lemonade",
    name: "Exotic Flower — Cherry Lemonade",
    category: "Flower",
    subcategories: ["indoor", "exotic", "small-batch"],
    price: 40.0,
    potency: "28% THCA",
    image: IMG.cherryLemonade06,
    badge: "Small Batch",
    coaUrl: "/coas/cherry-lemonade.pdf",
    variants: [
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },
  {
    id: "fl-04",
    slug: "exotic-thca-flower-wedding-cake",
    name: "Exotic Flower — Wedding Cake",
    category: "Flower",
    subcategories: ["indoor", "exotic", "small-batch"],
    price: 40.0,
    potency: "28% THCA",
    image: IMG.weddingCake,
    badge: "Small Batch",
    coaUrl: "/coas/wedding-cake.pdf",
    variants: [
      { id: "1g", label: "1 g", grams: 1, price: 12, stock: 10 },
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },
  {
    id: "fl-05",
    slug: "thca-flower-modified-grapes",
    name: "Indoor Flower — Modified Grapes",
    category: "Flower",
    subcategories: ["indoor", "small-batch"],
    price: 40.0,
    potency: "28% THCA",
    image: IMG.modifiedGrapes,
    badge: "Small Batch",
    coaUrl: "/coas/modified-grapes.pdf",
    variants: [
      { id: "1g", label: "1 g", grams: 1, price: 12, stock: 10 },
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },
  {
    id: "fl-06",
    slug: "thca-flower-jelly-breath",
    name: "Indoor Flower — Jelly Breath",
    category: "Flower",
    subcategories: ["indoor", "organic"],
    price: 40.0,
    potency: "28% THCA",
    image: IMG.jellysBreath,
    images: [IMG.jellysBreath, IMG.jellysBreath2, IMG.jellysBreath3],
    badge: "Small Batch",
    coaUrl: "/coas/modified-grapes.pdf",
    variants: [
      { id: "1g", label: "1 g", grams: 1, price: 12, stock: 10 },
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },
  {
    id: "fl-07",
    slug: "indoor-flower-butter-face",
    name: "Indoor Flower — Butter Face",
    category: "Flower",
    subcategories: ["indoor", "no-till"],
    price: 40.0,
    potency: "28% THCA",
    image: IMG.butterface,
    images: [IMG.butterface, IMG.butterface2, IMG.butterface3],
    badge: "Small Batch",
    coaUrl: "/coas/modified-grapes.pdf",
    variants: [
      { id: "1g", label: "1 g", grams: 1, price: 12, stock: 10 },
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },
  {
    id: "fl-08",
    slug: "indoor-flower-mimosa",
    name: "Indoor Flower — Mimosa",
    category: "Flower",
    subcategories: ["indoor", "organic", "no-till"],
    price: 40.0,
    potency: "28% THCA",
    image: IMG.mimosa,
    images: [IMG.mimosa, IMG.mimosa2, IMG.mimosa3],
    badge: "Small Batch",
    coaUrl: "/coas/modified-grapes.pdf",
    variants: [
      { id: "1g", label: "1 g", grams: 1, price: 12, stock: 10 },
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },
  {
    id: "fl-10",
    slug: "indoor-flower-platinum-runts",
    name: "Indoor Flower — Platinum Runts",
    category: "Flower",
    subcategories: ["indoor"],
    price: 40.0,
    potency: "28% THCA",
    image: IMG.butterface, // reuse butterface set
    images: [IMG.butterface, IMG.butterface2, IMG.butterface3],
    badge: "Small Batch",
    coaUrl: "/coas/modified-grapes.pdf",
    variants: [
      { id: "1g", label: "1 g", grams: 1, price: 12, stock: 10 },
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },

  // ------- Smalls -------
  {
    id: "sm-01",
    slug: "exotic-thca-flower-chocolate-mintz-smalls",
    name: "Exotic Flower — Chocolate Mintz-Smalls",
    category: "Smalls",
    subcategories: ["smalls", "indoor"],
    price: 40.0,
    potency: "28% THCA",
    image: IMG.chocolateMintz,
    badge: "Small Batch",
    coaUrl: "/coas/chocolate-mintz.pdf",
    variants: [
      { id: "1g", label: "1 g", grams: 1, price: 12, stock: 10 },
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },
  {
    id: "sm-02",
    slug: "indoor-thca-flower-ice-cream-cake-smalls",
    name: "Indoor Flower — Ice Cream Cake Smalls",
    category: "Smalls",
    subcategories: ["smalls", "indoor", "bestseller"],
    price: 24.0,
    potency: "26% THCA",
    image: IMG.iceCreamCake1,
    badge: "Bestseller",
    coaUrl: "/coas/ice-cream-cake.pdf",
    variants: [
      { id: "1g", label: "1 g", grams: 1, price: 12, stock: 10 },
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },
  {
    id: "sm-03",
    slug: "exotic-thca-flower-cherry-lemonade-smalls",
    name: "Exotic Flower — Cherry Lemonade Smalls",
    category: "Smalls",
    subcategories: ["smalls", "indoor", "exotic"],
    price: 28.0,
    potency: "28% THCA",
    image: IMG.cherryLemonade06,
    badge: "Small Batch",
    coaUrl: "/coas/cherry-lemonade.pdf",
    variants: [
      { id: "1g", label: "1 g", grams: 1, price: 12, stock: 10 },
      { id: "3.5g", label: "3.5 g", grams: 3.5, price: 35, isPopular: true, stock: 10 },
      { id: "7g", label: "7 g", grams: 7, price: 65, stock: 10 },
      { id: "14g", label: "14 g", grams: 14, price: 120, stock: 10 },
      { id: "28g", label: "28 g", grams: 28, price: 220, stock: 10 },
    ],
    active: true,
  },

  // ------- Edibles (product-level stock) -------
  {
    id: "ed-01",
    slug: "thca-1-1-brown-butter-bliss-100mg",
    name: "THCA 1:1 Brown Butter Bliss (100mg)",
    category: "Edibles",
    subcategories: ["cookies"],
    price: 15.0,
    potency: "100mg",
    image: IMG.brownButterBliss,
    images: [IMG.brownButterBliss2, IMG.brownButterBliss2, IMG.brownButterBliss2],
    badge: "Limited",
    stock: 20,
    active: true,
  },
  {
    id: "ed-02",
    slug: "thca-1-1-peppermint-brownie-100mg",
    name: "THCA 1:1 Peppermint Brownie (100mg)",
    category: "Edibles",
    subcategories: ["brownies"],
    price: 29.0,
    potency: "100mg",
    image: IMG.peppermintBrownie,
    images: [IMG.peppermintBrownie, IMG.peppermintBrownie2, IMG.peppermintBrownie3, IMG.peppermintBrownie4],
    badge: "Limited",
    stock: 20,
    active: true,
  },
  {
    id: "ed-03",
    slug: "thca-stout-brownie-with-butterscotch-100mg",
    name: "THCA Stout Brownie With Butterscotch (100mg)",
    category: "Edibles",
    subcategories: ["brownies"],
    price: 29.0,
    potency: "10mg squares",
    image: IMG.stoutBrownie,
    images: [IMG.stoutBrownie, IMG.stoutBrownie2, IMG.stoutBrownie3, IMG.stoutBrownie4],
    badge: "Limited",
    stock: 20,
    active: true,
  },
  {
    id: "ed-04",
    slug: "thca-raspberry-fruit-syrup-100mg",
    name: "THCA Raspberry Fruit Syrup (100mg)",
    category: "Edibles",
    subcategories: ["syrups"],
    price: 29.0,
    potency: "100mg",
    image: IMG.fruitSyrupRasberry,
    images: [IMG.fruitSyrupRasberry, IMG.fruitSyrupRasberry2, IMG.fruitSyrupRasberry3],
    badge: "Limited",
    stock: 20,
    active: true,
  },
  {
    id: "ed-05",
    slug: "thca-honey-hibiscus-sleep-tincture",
    name: "THCA Honey Hibiscus Sleep Tincture",
    category: "Edibles",
    subcategories: ["tinctures"],
    price: 29.0,
    potency: "500mg bottle",
    image: IMG.honeyHibiscus,
    images: [IMG.honeyHibiscus, IMG.honeyHibiscus2, IMG.honeyHibiscus3],
    badge: "Limited",
    stock: 2,
    active: true,
  },
  {
    id: "ed-06",
    slug: "thca-berry-fruit-gummy",
    name: "THCA Berry Fruit Gummy ",
    category: "Edibles",
    subcategories: ["gummies"],
    price: 29.0,
    potency: "10mg squares",
    image: IMG.berryFruitGummy,
    images: [IMG.berryFruitGummy, IMG.berryFruitGummy2, IMG.berryFruitGummy3],
    badge: "Limited",
    stock: 20,
    active: true,
  },
  {
    id: "ed-07",
    slug: "thca-chocolate-brownie",
    name: "THCA Chocolate Brownie ",
    category: "Edibles",
    subcategories: ["brownies"],
    price: 29.0,
    potency: "10mg squares",
    image: IMG.chocolateBrownie,
    images: [IMG.chocolateBrownie, IMG.chocolateBrownie2, IMG.chocolateBrownie3],
    badge: "Limited",
    stock: 20,
    active: true,
  },
  {
    id: "ed-08",
    slug: "thca-french-vanilla-sleep-tincture",
    name: "THCA French Vanilla Sleep Tincture",
    category: "Edibles",
    subcategories: ["tinctures"],
    price: 29.0,
    potency: "500mg bottle",
    image: IMG.frenchVanilla,
    images: [IMG.frenchVanilla, IMG.frenchVanilla2, IMG.frenchVanilla3, IMG.frenchVanilla4],
    badge: "Limited",
    stock: 2,
    active: true,
  },
  {
    id: "ed-09",
    slug: "thca-sour-pineapple-fruit-gummy",
    name: "THCA Sour Pineapple Fruit Gummy",
    category: "Edibles",
    subcategories: ["gummies"],
    price: 29.0,
    potency: "100mg gummy",
    image: IMG.sourPineapple,
    images: [IMG.sourPineapple, IMG.sourPineapple2, IMG.sourPineapple3, IMG.sourPineapple4],
    badge: "Limited",
    stock: 0,
    active: true,
  },
  {
    id: "ed-10",
    slug: "muddy-buddy-chocolate",
    name: "Muddy Buddy Chocolate",
    category: "Edibles",
    subcategories: ["chocolate"],
    price: 29.0,
    potency: "100mg chocolate",
    image: IMG.muddyBuddy,
    images: [IMG.muddyBuddy, IMG.muddyBuddy2, IMG.muddyBuddy3, IMG.muddyBuddy4],
    badge: "Limited",
    stock: 2,
    active: true,
  },

  // ------- Concentrates (product-level stock) -------
  {
    id: "con-01",
    slug: "dantes-inferno-live-resin",
    name: "THCA Dantes Inferno Live Resin",
    category: "Concentrates",
    subcategories: ["live-resin"],
    price: 15.0,
    potency: "100mg",
    image: IMG.danteInferno,
    images: [IMG.danteInferno, IMG.danteInferno2],
    badge: "Limited",
    stock: 2,
    active: true,
  },
  {
    id: "con-02",
    slug: "black-ice-bubble-hash-4*",
    name: "Black Ice Bubble Hash 4*",
    category: "Concentrates",
    subcategories: ["bubble-hash"],
    price: 15.0,
    potency: "100mg",
    image: IMG.blackIce,
    images: [IMG.blackIce, IMG.blackIce2],
    badge: "Limited",
    stock: 1,
    active: true,
  },
  {
    id: "con-03",
    slug: "brickleberry-hash-rosin",
    name: "Brickleberry Hash Rosin",
    category: "Concentrates",
    subcategories: ["hash-rosin"],
    price: 65.0,
    potency: "100mg",
    image: IMG.brickleberry,
    images: [
      IMG.brickleberry,
      IMG.brickleberry2,
      IMG.brickleberry3,
      IMG.brickleberry4,
      IMG.brickleberry5,
      IMG.brickleberry6,
      IMG.brickleberry7,
    ],
    badge: "Limited",
    stock: 2,
    active: true,
  },
  {
    id: "con-04",
    slug: "feijoa--hash-rosin",
    name: "Feijoa Hash Rosin",
    category: "Concentrates",
    subcategories: ["hash-rosin"],
    price: 65.0,
    potency: "100mg",
    image: IMG.feijoa,
    images: [IMG.feijoa, IMG.feijoa2, IMG.feijoa3, IMG.feijoa4, IMG.feijoa5, IMG.feijoa6, IMG.feijoa7],
    badge: "Limited",
    stock: 2,
    active: true,
  },
  {
    id: "con-05",
    slug: "honey-donut-rosin",
    name: "Honey Donut Hash Rosin",
    category: "Concentrates",
    subcategories: ["hash-rosin"],
    price: 65.0,
    potency: "100mg",
    image: IMG.honeyDonut,
    images: [
      IMG.honeyDonut,
      IMG.honeyDonut2,
      IMG.honeyDonut3,
      IMG.honeyDonut4,
      IMG.honeyDonut5,
      IMG.honeyDonut6,
      IMG.honeyDonut7,
    ],
    badge: "Limited",
    stock: 2,
    active: true,
  },
  {
    id: "con-06",
    slug: "papaya-juice-rosin",
    name: "Papaya Juice Hash Rosin",
    category: "Concentrates",
    subcategories: ["hash-rosin"],
    price: 65.0,
    potency: "100mg",
    image: IMG.papayaJuice,
    images: [IMG.papayaJuice, IMG.papayaJuice2, IMG.papayaJuice3],
    badge: "Limited",
    stock: 2,
    active: true,
  },
];

/* =========================
   Indexes & helpers
   ========================= */

export const PRODUCTS_BY_ID: Record<string, Product> = Object.freeze(
  Object.fromEntries(products.map((p) => [p.id.toLowerCase(), p])) as Record<string, Product>
);

export const PRODUCTS_BY_SLUG: Record<string, Product> = Object.freeze(
  Object.fromEntries(products.map((p) => [p.slug.toLowerCase(), p])) as Record<string, Product>
);

function resolveProduct(
  pOrKey: { id?: string; slug?: string; name?: string } | string
): Product | undefined {
  if (!pOrKey) return undefined;

  // string key lookup
  if (typeof pOrKey === "string") {
    const key = pOrKey.trim().toLowerCase();
    if (!key) return undefined;

    const byId = PRODUCTS_BY_ID[key];
    if (byId) return byId;

    const bySlug = PRODUCTS_BY_SLUG[key];
    if (bySlug) return bySlug;

    return products.find((p) => p.name.toLowerCase() === key);
  }

  // object lookup
  const id = pOrKey.id?.trim().toLowerCase();
  if (id) {
    const byId = PRODUCTS_BY_ID[id];
    if (byId) return byId;
  }

  const slug = pOrKey.slug?.trim().toLowerCase();
  if (slug) {
    const bySlug = PRODUCTS_BY_SLUG[slug];
    if (bySlug) return bySlug;
  }

  const name = pOrKey.name?.trim().toLowerCase();
  if (name) {
    return products.find((p) => p.name.toLowerCase() === name);
  }

  return undefined;
}

function dollarsToCents(d: number | undefined): number {
  if (typeof d !== "number") return 0;
  return Math.round(d * 100);
}

export function getVariantsForProduct(
  pOrKey: { id?: string; slug?: string; name?: string } | string
): { label: string; priceCents: number; popular?: boolean }[] | undefined {
  const prod = resolveProduct(pOrKey);
  if (!prod?.variants?.length) return undefined;

  return prod.variants.map((v) => ({
    label: v.label,
    priceCents: dollarsToCents(v.price),
    popular: !!v.isPopular,
  }));
}

export function getCoaUrl(
  pOrKey: { id?: string; slug?: string; name?: string } | string
): string | undefined {
  return resolveProduct(pOrKey)?.coaUrl;
}

export default products;
