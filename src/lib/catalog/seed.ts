import type { Anime, AnimeKind } from "./provider";

// Catálogo inicial gerado por tools/import-catalog.mjs a partir do
// anime-offline-database (manami-project), licença ODbL 1.0 + DbCL 1.0.
// Capas: caminhos de pôster do TMDB (tools/fetch-covers.mjs).
// Não editar o JSON à mão: ajuste tools/catalog-curated.json e rode os scripts.
//
// O JSON (~600 KB) NÃO é importado de forma estática: carrega sob demanda
// (import dinâmico), para não pesar no código de todas as páginas.

export type CatalogRow = {
  id: string;
  title: string;
  aliases: string[];
  year: number | null;
  kind: string;
  episodes: number | null;
  cover: string | null;
  genres?: string[];
};

export type CatalogSource = { name: string; author: string; url: string; tag: string; license: string };

export function rowToAnime(a: CatalogRow): Anime {
  return {
    id: a.id,
    title: a.title,
    titleOriginal: null,
    aliases: a.aliases,
    year: a.year,
    kind: a.kind as AnimeKind,
    episodes: a.episodes,
    cover: a.cover ?? null,
    genres: a.genres ?? [],
    isVerified: true,
  };
}

export async function loadCatalogFile(): Promise<{ source: CatalogSource; anime: Anime[] }> {
  const mod = await import("./catalog.generated.json");
  const data = mod.default as { source: CatalogSource; anime: CatalogRow[] };
  return { source: data.source, anime: data.anime.map(rowToAnime) };
}

/** Destaques na tela Buscar (ids de tools/catalog-curated.json). */
export const FEATURED_IDS = [
  "frieren", "shingeki-no-kyojin", "cowboy-bebop", "kimetsu-no-yaiba", "jujutsu-kaisen",
  "spy-x-family", "sen-to-chihiro", "fma-brotherhood", "chainsaw-man", "bocchi-the-rock",
  "one-piece", "dandadan", "kimi-no-na-wa", "dungeon-meshi", "mob-psycho-100",
];
