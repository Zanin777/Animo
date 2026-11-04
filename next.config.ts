import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Só pôsteres (w342) e imagens de episódio (w300) do TMDB. Qualquer outro endereço é recusado.
    remotePatterns: [new URL("https://image.tmdb.org/t/p/w342/**"), new URL("https://image.tmdb.org/t/p/w300/**")],
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
