import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Só pôsteres do TMDB no tamanho w342. Qualquer outro endereço é recusado.
    remotePatterns: [new URL("https://image.tmdb.org/t/p/w342/**")],
    qualities: [75],
    maximumRedirects: 0,
    minimumCacheTTL: 2678400, // 31 dias: capas quase nunca mudam
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
