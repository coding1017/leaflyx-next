// lib/blog.ts

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string; // YYYY-MM-DD
  heroImage?: string;  // /public path (string)
  category?: string;   // e.g. "Legality", "Cannabinoids", "Quality"
  featured?: boolean;
  content: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "ul"; items: string[] }
  >;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-is-thca",
    title: "What Is THCA?",
    excerpt:
      "A clear explanation of THCA, how it differs from Delta-9 THC, and why lab testing matters.",
    publishedAt: "2026-02-02",
    heroImage: "/images/blog/leaflyx-learn-1.jpg", // add later or remove
    category: "Cannabinoids",
    featured: true,
    content: [
      { type: "p", text: "THCA is a naturally occurring cannabinoid found in hemp flower..." },
      { type: "h2", text: "THCA vs THC" },
      { type: "p", text: "THCA is the acidic precursor that can convert through heat..." },
      { type: "ul", items: ["THCA is measured on COAs", "Delta-9 THC must remain compliant", "Storage and heat change outcomes"] },
    ],
  },

  {
    slug: "how-to-read-a-coa",
    title: "How to Read a COA",
    excerpt:
      "Learn how to verify potency, check contaminant panels, and spot red flags fast.",
    publishedAt: "2026-02-02",
    heroImage: "/images/blog/leaflyx-learn-2.jpg",
    category: "Quality",
    featured: true,
    content: [
      { type: "p", text: "COAs are third-party lab reports that show cannabinoid content..." },
      { type: "h2", text: "What to check first" },
      { type: "ul", items: ["Cannabinoid potency", "Date tested", "Contaminant panel coverage"] },
    ],
  },

  {
    slug: "thca-legality-basics",
    title: "THCA Legality Basics",
    excerpt:
      "A practical overview of hemp legality and why local regulations still matter.",
    publishedAt: "2026-02-02",
    heroImage: "/images/blog/leaflyx-learn-3.jpg",
    category: "Legality",
    featured: false,
    content: [
      { type: "p", text: "Laws vary by jurisdiction. This is not legal advice..." },
      { type: "p", text: "Leaflyx provides third-party COAs so you can verify cannabinoid content." },
    ],
  },
];

export function getPostBySlug(slug: string) {
  const s = String(slug ?? "").toLowerCase();
  return BLOG_POSTS.find((p) => p.slug.toLowerCase() === s) ?? null;
}

export function getFeaturedPosts(limit = 3) {
  return BLOG_POSTS.filter((p) => p.featured).slice(0, limit);
}

export function getAllPostsSorted() {
  return [...BLOG_POSTS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
