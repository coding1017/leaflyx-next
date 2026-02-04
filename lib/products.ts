// lib/products.ts

import type { StaticImageData } from "next/image";

/* =========================
   Static image imports
   ========================= */

// Flower / Smalls / Shared
import iceCreamCake1 from "@/public/images/products/ice-cream-cake-1.jpg";
import chocolateMintz from "@/public/images/products/chocolate-mintz.png";
import cherryLemonade06 from "@/public/images/products/cherry-lemonade-06.jpg";
import weddingCake from "@/public/images/products/wedding-cake.png";
import modifiedGrapes from "@/public/images/products/modified-grapes.png";

import jellysBreath    from "public/images/products/jellys-breath.jpg";
import jellysBreath2   from "public/images/products/jellys-breath2.jpg";
import jellysBreath3   from "public/images/products/jellys-breath3.jpg";

import butterface from "@/public/images/products/butterface.jpg";
import butterface2 from "@/public/images/products/butterface2.jpg";
import butterface3 from "@/public/images/products/butterface3.jpg";

import mimosa from "@/public/images/products/mimosa.jpg";
import mimosa2 from "@/public/images/products/mimosa2.jpg";
import mimosa3 from "@/public/images/products/mimosa3.jpg";

// Edibles
import brownButterBliss from "@/public/images/products/brown-butter-bliss.jpg";
import brownButterBliss2 from "@/public/images/products/brown-butter-bliss2.jpg";

import peppermintBrownie from "@/public/images/products/peppermint-brownie.jpg";
import peppermintBrownie2 from "@/public/images/products/peppermint-brownie2.jpg";
import peppermintBrownie3 from "@/public/images/products/peppermint-brownie3.jpg";
import peppermintBrownie4 from "@/public/images/products/peppermint-brownie4.jpg";

import stoutBrownie from "@/public/images/products/stout-brownie.jpg";
import stoutBrownie2 from "@/public/images/products/stout-brownie2.jpg";
import stoutBrownie3 from "@/public/images/products/stout-brownie3.jpg";
import stoutBrownie4 from "@/public/images/products/stout-brownie4.jpg";

import fruitSyrupRasberry from "@/public/images/products/fruit-syrup-rasberry.jpg";
import fruitSyrupRasberry2 from "@/public/images/products/fruit-syrup-rasberry2.jpg";
import fruitSyrupRasberry3 from "@/public/images/products/fruit-syrup-rasberry3.jpg";

import honeyHibiscus from "@/public/images/products/honey-hibiscus.jpg";
import honeyHibiscus2 from "@/public/images/products/honey-hibiscus2.jpg";
import honeyHibiscus3 from "@/public/images/products/honey-hibiscus3.jpg";

import berryFruitGummy from "@/public/images/products/berry-fruit-gummy.jpg";
import berryFruitGummy2 from "@/public/images/products/berry-fruit-gummy2.jpg";
import berryFruitGummy3 from "@/public/images/products/berry-fruit-gummy3.jpg";

import chocolateBrownie from "@/public/images/products/chocolate-brownie.jpg";
import chocolateBrownie2 from "@/public/images/products/chocolate-brownie2.jpg";
import chocolateBrownie3 from "@/public/images/products/chocolate-brownie3.jpg";

import frenchVanilla from "@/public/images/products/french-vanilla.jpg";
import frenchVanilla2 from "@/public/images/products/french-vanilla2.jpg";
import frenchVanilla3 from "@/public/images/products/french-vanilla3.jpg";
import frenchVanilla4 from "@/public/images/products/french-vanilla4.jpg";

import sourPineapple from "@/public/images/products/sour-pineapple-fruit-gummy.jpg";
import sourPineapple2 from "@/public/images/products/sour-pineapple-fruit-gummy2.jpg";
import sourPineapple3 from "@/public/images/products/sour-pineapple-fruit-gummy3.jpg";
import sourPineapple4 from "@/public/images/products/sour-pineapple-fruit-gummy4.jpg";

import muddyBuddy from "@/public/images/products/muddy-buddy.jpg";
import muddyBuddy2 from "@/public/images/products/muddy-buddy2.jpg";
import muddyBuddy3 from "@/public/images/products/muddy-buddy3.jpg";
import muddyBuddy4 from "@/public/images/products/muddy-buddy4.jpg";

// Concentrates
import danteInferno from "@/public/images/products/dante-inferno.jpg";
import danteInferno2 from "@/public/images/products/dante-inferno2.jpg";

import blackIce from "@/public/images/products/black-ice.jpg";
import blackIce2 from "@/public/images/products/black-ice2.jpg";

import brickleberry from "@/public/images/products/brickleberry.jpg";
import brickleberry2 from "@/public/images/products/brickleberry2.jpg";
import brickleberry3 from "@/public/images/products/brickleberry3.jpg";
import brickleberry4 from "@/public/images/products/brickleberry4.jpg";
import brickleberry5 from "@/public/images/products/brickleberry5.jpg";
import brickleberry6 from "@/public/images/products/brickleberry6.jpg";
import brickleberry7 from "@/public/images/products/brickleberry7.jpg";

import feijoa from "@/public/images/products/feijoa.jpg";
import feijoa2 from "@/public/images/products/feijoa2.jpg";
import feijoa3 from "@/public/images/products/feijoa3.jpg";
import feijoa4 from "@/public/images/products/feijoa4.jpg";
import feijoa5 from "@/public/images/products/feijoa5.jpg";
import feijoa6 from "@/public/images/products/feijoa6.jpg";
import feijoa7 from "@/public/images/products/feijoa7.jpg";

import honeyDonut from "@/public/images/products/honey-donut.jpg";
import honeyDonut2 from "@/public/images/products/honey-donut2.jpg";
import honeyDonut3 from "@/public/images/products/honey-donut3.jpg";
import honeyDonut4 from "@/public/images/products/honey-donut4.jpg";
import honeyDonut5 from "@/public/images/products/honey-donut5.jpg";
import honeyDonut6 from "@/public/images/products/honey-donut6.jpg";
import honeyDonut7 from "@/public/images/products/honey-donut7.jpg";

import papayaJuice from "@/public/images/products/papaya-juice.jpg";
import papayaJuice2 from "@/public/images/products/papaya-juice2.jpg";
import papayaJuice3 from "@/public/images/products/papaya-juice3.jpg";

/* =========================
   Types
   ========================= */

export type Variant = {
  id: string; // "1g", "3.5g"
  label: string; // "1 g", "3.5 g"
  grams: number; // 1, 3.5, etc
  price: number; // price for this size (DOLLARS)
  isPopular?: boolean;
  stock?: number; // units for this size; 0 = sold out
};

export type ProductImage = string | StaticImageData;

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
    | "Misc"
    | "Smalls";
  /** New: stackable filtering facets like "indoor", "organic", "cookies", "gummies", etc. */
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
    image: iceCreamCake1,
    images: [iceCreamCake1],
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
    image: chocolateMintz,
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
    image: cherryLemonade06,
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
    image: weddingCake,
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
    image: modifiedGrapes,
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
    image: jellysBreath, // main hero (upper-case filename)
    images: [jellysBreath, jellysBreath2, jellysBreath3],
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
    image: butterface,
    images: [butterface, butterface2, butterface3],
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
    image: mimosa,
    images: [mimosa, mimosa2, mimosa3],
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
    image: butterface, // reuse butterface set (as in your data)
    images: [butterface, butterface2, butterface3],
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
    image: chocolateMintz,
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
    image: iceCreamCake1,
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
    image: cherryLemonade06,
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
    image: brownButterBliss,
    images: [brownButterBliss2, brownButterBliss2, brownButterBliss2],
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
    image: peppermintBrownie,
    images: [peppermintBrownie, peppermintBrownie2, peppermintBrownie3, peppermintBrownie4],
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
    image: stoutBrownie,
    images: [stoutBrownie, stoutBrownie2, stoutBrownie3, stoutBrownie4],
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
    image: fruitSyrupRasberry,
    images: [fruitSyrupRasberry, fruitSyrupRasberry2, fruitSyrupRasberry3],
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
    image: honeyHibiscus,
    images: [honeyHibiscus, honeyHibiscus2, honeyHibiscus3],
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
    image: berryFruitGummy,
    images: [berryFruitGummy, berryFruitGummy2, berryFruitGummy3],
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
    image: chocolateBrownie,
    images: [chocolateBrownie, chocolateBrownie2, chocolateBrownie3],
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
    image: frenchVanilla,
    images: [frenchVanilla, frenchVanilla2, frenchVanilla3, frenchVanilla4],
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
    potency: "100mg ggummy",
    image: sourPineapple,
    images: [sourPineapple, sourPineapple2, sourPineapple3, sourPineapple4],
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
    image: muddyBuddy,
    images: [muddyBuddy, muddyBuddy2, muddyBuddy3, muddyBuddy4],
    badge: "Limited",
    stock: 2,
    active: true,
  },
  {
    id: "ed-11",
    slug: "thca-french-vanilla-sleep-tincture",
    name: "THCA French Vanilla Sleep Tincture",
    category: "Edibles",
    subcategories: ["tinctures"],
    price: 29.0,
    potency: "500mg bottle",
    image: frenchVanilla,
    images: [frenchVanilla, frenchVanilla2, frenchVanilla3, frenchVanilla4],
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
    image: danteInferno,
    images: [danteInferno, danteInferno2],
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
    image: blackIce,
    images: [blackIce, blackIce2],
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
    image: brickleberry,
    images: [brickleberry, brickleberry2, brickleberry3, brickleberry4, brickleberry5, brickleberry6, brickleberry7],
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
    image: feijoa,
    images: [feijoa, feijoa2, feijoa3, feijoa4, feijoa5, feijoa6, feijoa7],
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
    image: honeyDonut,
    images: [honeyDonut, honeyDonut2, honeyDonut3, honeyDonut4, honeyDonut5, honeyDonut6, honeyDonut7],
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
    image: papayaJuice,
    images: [papayaJuice, papayaJuice2, papayaJuice3, honeyDonut4, honeyDonut5, honeyDonut6, honeyDonut7],
    badge: "Limited",
    stock: 2,
    active: true,
  },
];

/* =========================
   Indexes & helpers
   ========================= */

export const PRODUCTS_BY_ID: Record<string, Product> = Object.freeze(
  Object.fromEntries(products.map((p) => [p.id.toLowerCase(), p]))
);

export const PRODUCTS_BY_SLUG: Record<string, Product> = Object.freeze(
  Object.fromEntries(products.map((p) => [p.slug.toLowerCase(), p]))
);

function resolveProduct(pOrKey: { id?: string; slug?: string; name?: string } | string): Product | undefined {
  if (!pOrKey) return undefined;
  if (typeof pOrKey === "string") {
    const key = pOrKey.toLowerCase();
    return PRODUCTS_BY_ID[key] || PRODUCTS_BY_SLUG[key] || products.find((p) => p.name.toLowerCase() === key);
  }
  const id = pOrKey.id?.toLowerCase();
  const slug = pOrKey.slug?.toLowerCase();
  const name = pOrKey.name?.toLowerCase();
  return (
    (id && PRODUCTS_BY_ID[id]) ||
    (slug && PRODUCTS_BY_SLUG[slug]) ||
    products.find((p) => p.name.toLowerCase() === name)
  );
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
