// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
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
