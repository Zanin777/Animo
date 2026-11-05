import type { Anime } from "./provider";

export interface SeasonTab {
  anime: Anime;
  season: number;
  /** 1, 2… quando a mesma temporada do TMDB está dividida em partes no catálogo */
  part: number | null;
}

/**
 * Todas as temporadas da mesma série do TMDB, em ordem.
 * Devolve [] para filmes, animes sem TMDB ou séries com uma temporada só.
 */
export function seasonsOf(anime: Anime, catalog: Anime[]): SeasonTab[] {
  const t = anime.tmdb;
  if (!t || t.type !== "tv") return [];
  const same = catalog
    .filter((a) => a.tmdb?.type === "tv" && a.tmdb.id === t.id)
    .sort((a, b) => {
      const x = a.tmdb as Extract<Anime["tmdb"], { type: "tv" }>;
      const y = b.tmdb as Extract<Anime["tmdb"], { type: "tv" }>;
      return x.season - y.season || x.offset - y.offset;
    });
  if (same.length < 2) return [];
  const perSeason = new Map<number, number>();
  for (const a of same) {
    const s = (a.tmdb as { season: number }).season;
    perSeason.set(s, (perSeason.get(s) ?? 0) + 1);
  }
  const seen = new Map<number, number>();
  return same.map((a) => {
    const s = (a.tmdb as { season: number }).season;
    const k = (seen.get(s) ?? 0) + 1;
    seen.set(s, k);
    return { anime: a, season: s, part: (perSeason.get(s) ?? 1) > 1 ? k : null };
  });
}
