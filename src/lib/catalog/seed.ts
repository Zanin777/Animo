import type { Anime, AnimeKind } from "./provider";
import generated from "./catalog.generated.json";

// Catálogo inicial gerado por tools/import-catalog.mjs a partir do
// anime-offline-database (manami-project), licença ODbL 1.0 + DbCL 1.0.
// Não editar o JSON à mão: ajuste tools/catalog-curated.json e rode o script.

type Row = { id: string; title: string; aliases: string[]; year: number | null; kind: string; episodes: number | null };

export const CATALOG_SOURCE = generated.source;

/** Destaques na tela Buscar (ids de tools/catalog-curated.json). */
export const FEATURED_IDS = [
  "frieren", "shingeki-no-kyojin", "cowboy-bebop", "kimetsu-no-yaiba", "jujutsu-kaisen",
  "spy-x-family", "sen-to-chihiro", "fma-brotherhood", "chainsaw-man", "bocchi-the-rock",
  "one-piece", "dandadan", "kimi-no-na-wa", "dungeon-meshi", "mob-psycho-100",
];

export const SEED_ANIME: Anime[] = (generated.anime as Row[]).map((a) => ({
  id: a.id,
  title: a.title,
  titleOriginal: null,
  aliases: a.aliases,
  year: a.year,
  kind: a.kind as AnimeKind,
  episodes: a.episodes,
  isVerified: true,
}));
