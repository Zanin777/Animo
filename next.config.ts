import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Só capas do AniList e imagens de episódio (w300) do TMDB. Qualquer outro endereço é recusado.
    // + fotos e capas de perfil do Storage do nosso Supabase (só os dois buckets públicos).
    remotePatterns: [
      new URL("https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/**"),
      new URL("https://image.tmdb.org/t/p/w300/**"),
      // capas trocadas por quem é Premium (pôsteres oficiais do TMDB)
      new URL("https://image.tmdb.org/t/p/w342/**"),
      ...(/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
        ? ["avatars", "banners"].map((b) => new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${b}/**`))
        : []),
    ],
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
