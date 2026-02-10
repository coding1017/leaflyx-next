// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    /**
     * ✅ Immediate production fix:
     * Stops Next/Image from routing through /_next/image (which is currently 400'ing for you)
     * so your images render normally.
     *
     * Later, once we confirm all src values are clean strings + domains are allowed,
     * you can flip this back to false.
     */
    unoptimized: true,

    /**
     * ✅ If you ever switch unoptimized back off, these prevent 400s from remote URLs.
     * Add/adjust hostnames if you use a CDN or storage host.
     */
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },

  async redirects() {
    return [
      // your existing redirect (leave it)
      {
        source: "/products/:category",
        destination: "/shop/:category",
        permanent: false,
      },

      // ✅ legacy product pages → new canonical
      {
        source: "/products/:slug",
        destination: "/shop/:slug",
        permanent: true,
      },

      // ✅ remove /shop/p from public URLs
      {
        source: "/shop/p/:slug",
        destination: "/shop/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
