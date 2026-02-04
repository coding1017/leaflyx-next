// utils/blur.ts

/** Small SVG shimmer placeholder (tint to your brand here if you like) */
export function shimmer(width: number, height: number) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#0b3b2b" offset="20%" />
        <stop stop-color="#1a4d3d" offset="50%" />
        <stop stop-color="#0b3b2b" offset="70%" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#0b3b2b" />
    <rect id="r" width="${width}" height="${height}" fill="url(#g)" />
    <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite" />
  </svg>`;
}

/** Base64 helper that works in SSR and in the browser (UTF-8 safe) */
export function toBase64(str: string) {
  if (typeof window === "undefined") {
    // Node / SSR
    return Buffer.from(str).toString("base64");
  }
  // Browser: encode to UTF-8 bytes before btoa
  const utf8 = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < utf8.length; i++) binary += String.fromCharCode(utf8[i]);
  return btoa(binary);
}
