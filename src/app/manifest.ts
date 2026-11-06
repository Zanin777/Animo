import type { MetadataRoute } from "next";

// Permite "instalar" o Aniora na tela inicial do celular, com o ícone próprio.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aniora",
    short_name: "Aniora",
    description: "Seu diário de anime.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#14161c",
    theme_color: "#14161c",
    icons: [
      { src: "/icon/app-192", sizes: "192x192", type: "image/png" },
      { src: "/icon/app-512", sizes: "512x512", type: "image/png" },
      { src: "/icon/app-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
