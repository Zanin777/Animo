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

export interface SeriesIndex {
  /** id de qualquer temporada → id da 1ª temporada da série (a "cabeça"); quem não tem série aponta para si */
  headOf: (id: string) => string;
  /** temporadas da série, em ordem ([] para animes sozinhos) */
  seasonsOf: (id: string) => SeasonTab[];
}

const cache = new WeakMap<Anime[], SeriesIndex>();

/**
 * Agrupa o catálogo em séries (mesma série de TV no TMDB). Calculado uma vez por catálogo.
 * Filmes, OVAs e animes sem TMDB ficam sozinhos.
 */
export function seriesIndex(catalog: Anime[]): SeriesIndex {
  const hit = cache.get(catalog);
  if (hit) return hit;
  const groups = new Map<number, Anime[]>();
  for (const a of catalog) {
    if (a.tmdb?.type !== "tv") continue;
    const g = groups.get(a.tmdb.id);
    if (g) g.push(a);
    else groups.set(a.tmdb.id, [a]);
  }
  const head = new Map<string, string>();
  const tabs = new Map<string, SeasonTab[]>();
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const list = seasonsOf(g[0], g);
    const h = list[0].anime.id;
    tabs.set(h, list);
    for (const s of list) head.set(s.anime.id, h);
  }
  const index: SeriesIndex = {
    headOf: (id) => head.get(id) ?? id,
    seasonsOf: (id) => tabs.get(head.get(id) ?? id) ?? [],
  };
  cache.set(catalog, index);
  return index;
}

/** Junta resultados de busca por série: cada série aparece uma vez, pela 1ª temporada, na posição do melhor resultado. */
export function collapseToSeries(results: Anime[], index: SeriesIndex, get: (id: string) => Anime | null): Anime[] {
  const seen = new Set<string>();
  const out: Anime[] = [];
  for (const a of results) {
    const h = index.headOf(a.id);
    if (seen.has(h)) continue;
    seen.add(h);
    out.push(get(h) ?? a);
  }
  return out;
}
