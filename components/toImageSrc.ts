// components/toImageSrc.ts
/**
 * Normalize any "image" value to a string URL usable by <Image src=...>.
 * Works for:
 * - "/images/foo.jpg" (string paths)
 * - { src: "/images/foo.jpg" } (Next static import)
 * - { url: "/images/foo.jpg" }
 * - { image: "/images/foo.jpg" }
 * - arrays like [ {src: "..."} , "...", ... ]
 * Falls back to /images/placeholder.png
 */
export function toImageSrc(input: any, fallback: string = "/images/placeholder.png"): string {
  if (!input) return fallback;

  // 1) strings
  if (typeof input === "string") return normalizePath(input) ?? fallback;

  // 2) objects (static imports / common keys)
  if (typeof input === "object") {
    if (typeof input.src === "string") return normalizePath(input.src) ?? fallback;
    if (typeof input.url === "string") return normalizePath(input.url) ?? fallback;
    if (typeof input.image === "string") return normalizePath(input.image) ?? fallback;

    // nested shapes: { image: {...} } or { images: [ ... ] }
    const nested = input.image || input.images?.[0] || input.url || input.src;
    if (nested) return toImageSrc(nested, fallback);
  }

  // 3) arrays
  if (Array.isArray(input) && input.length) return toImageSrc(input[0], fallback);

  return fallback;
}

function normalizePath(p?: string): string | undefined {
  if (!p) return undefined;

  // strip accidental "public/" prefix
  if (p.startsWith("public/")) p = p.slice("public/".length);

  // absolute URLs pass through; local files need a leading slash
  if (/^https?:\/\//i.test(p)) return p;
  if (!p.startsWith("/")) p = `/${p}`;
  return p;
}
