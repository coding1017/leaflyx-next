// utils/normalizeImage.ts
function isBadString(s?: string | null) {
  if (!s) return true;
  const t = s.trim().toLowerCase();
  return (
    !t ||
    t.includes("[object object]") ||
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  );
}

function normalizePath(p?: string): string | undefined {
  if (!p || isBadString(p)) return undefined;
  if (p.startsWith("public/")) p = p.slice("public/".length);
  if (/^https?:\/\//i.test(p)) return p;
  if (!p.startsWith("/")) p = `/${p}`;
  return p;
}

const get = (o: any, path: (string | number)[]) => {
  let cur = o;
  for (const k of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[k as any];
  }
  return cur;
};

function extractUrlDeep(input: any): string | undefined {
  if (input == null) return undefined;

  if (typeof input === "string") return normalizePath(input);
  if (Array.isArray(input)) {
    for (const item of input) {
      const v = extractUrlDeep(item);
      if (v) return v;
    }
    return undefined;
  }
  if (typeof input === "object") {
    const direct = ["src", "url", "image", "path", "href", "downloadUrl", "secure_url", "cdnUrl"];
    for (const k of direct) {
      const v = (input as any)[k];
      if (typeof v === "string") {
        const n = normalizePath(v);
        if (n) return n;
      }
    }
    // common CMS shapes
    const paths: (string | number)[][] = [
      ["data", "attributes", "url"], // Strapi v4
      ["formats", "large", "url"], ["formats", "medium", "url"], ["formats", "small", "url"], ["url"], // Strapi v3
      ["asset", "url"], // Sanity
      ["data", "full_url"], // Directus
      ["file", "url"], ["file", "src"],
      ["image", "url"], ["image", "src"],
      ["images", 0, "url"], ["images", 0, "src"],
      ["media", 0, "url"],  ["media", 0, "src"],
      ["photos", 0, "url"], ["photos", 0, "src"],
      ["gallery", 0, "url"],["gallery", 0, "src"],
      ["photo"], ["picture"]
    ];
    for (const p of paths) {
      const v = get(input, p);
      if (typeof v === "string") {
        const n = normalizePath(v);
        if (n) return n;
      }
    }
    // shallow scan last
    for (const v of Object.values(input)) {
      const n = extractUrlDeep(v);
      if (n) return n;
    }
  }
  return undefined;
}

export function normalizeImage(input: any, fallback = "/images/placeholder.png"): string {
  const url = extractUrlDeep(input);
  return url ?? fallback;
}

export function normalizePrimaryForProduct(p: any, metaBySlug?: any, fallback = "/images/placeholder.png") {
  const candidates = [
    p?.image, p?.images, p?.media, p?.photos, p?.gallery, p?.picture,
    metaBySlug?.image, metaBySlug?.images, metaBySlug?.media, metaBySlug?.photos,
    metaBySlug?.gallery, metaBySlug?.picture, metaBySlug?.photo, metaBySlug?.url,
  ];
  for (const c of candidates) {
    const s = normalizeImage(c, fallback);
    if (s && s !== fallback) return s;
  }
  return fallback;
}
