// app/sitemap.ts
import type { MetadataRoute } from "next";

import { SEARCH_LANDING_SLUGS } from "@/lib/search-landings";
import { BLOG_POSTS } from "@/lib/blog";
import { products } from "@/lib/products";

// ✅ Keep categories in sync with app/category/[slug]/page.tsx
const CATEGORY_SLUGS = [
  "flower",
  "smalls",
  "edibles",
  "vapes",
  "beverages",
  "pre-rolls",
  "concentrates",
] as const;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Curated static URLs (safe, intentional).
 * Keep it tight: no account, no admin.
 */
const STATIC_URLS = [
  "/",
  "/shop",
  "/products",
  "/coa",
  "/about",
  "/faq",
  "/blog",
];

function normalizePath(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

function entry(
  path: string,
  opts?: {
    priority?: number;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    lastModified?: Date;
  }
): MetadataRoute.Sitemap[number] {
  const p = normalizePath(path);
  return {
    url: `${BASE}${p}`,
    lastModified: opts?.lastModified ?? new Date(),
    changeFrequency: opts?.changeFrequency ?? "weekly",
    priority: typeof opts?.priority === "number" ? opts.priority : p === "/" ? 1 : 0.7,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 1) Core static pages
  const core = STATIC_URLS.map((p) =>
    entry(p, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: p === "/" ? 1 : 0.75,
    })
  );

  // 2) Canonical categories
  const categories = CATEGORY_SLUGS.map((slug) =>
    entry(`/category/${slug}`, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  // 3) Search-driven landing pages (buyer intent)
  const searchLandings = SEARCH_LANDING_SLUGS.map((slug) =>
    entry(`/shop/search/${slug}`, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    })
  );

  // 4) Blog posts (evergreen content)
  const blogPosts = BLOG_POSTS.map((post) =>
    entry(`/blog/${post.slug}`, {
      // If you store publishedAt, you *could* use that here, but "now" is fine.
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    })
  );

  // 5) Canonical product pages: /shop/[slug]
  const productPages = (products as any[])
    .filter((p) => p && p.active !== false)
    .map((p) => String(p.slug ?? "").trim())
    .filter(Boolean)
    .map((slug) =>
      entry(`/shop/${encodeURIComponent(slug)}`, {
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.85,
      })
    );

  // 6) De-dupe by URL (safety net)
  const seen = new Set<string>();
  const all = [...core, ...categories, ...searchLandings, ...blogPosts, ...productPages].filter((x) => {
    if (seen.has(x.url)) return false;
    seen.add(x.url);
    return true;
  });

  return all;
}
