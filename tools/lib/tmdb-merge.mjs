// Junta os caches do TMDB (ids e temporadas) nos itens do catálogo. A capa vem do AniList (anilist.mjs).
// Usado por import-catalog, fetch-covers e fetch-seasons, para o resultado
// ser o mesmo qualquer que seja o script rodado por último.

export const POSTER_PATH = /^\/[A-Za-z0-9_-]{5,64}\.(jpg|png)$/;
const validPath = (p) => (typeof p === "string" && POSTER_PATH.test(p) ? p : null);
const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);

/** Muta `anime` (itens do catálogo) e devolve contagens. */
export function applyTmdb(anime, covers, seasons) {
  const stats = { tv: 0, movies: 0, seasonCovers: 0 };
  for (const a of anime) {
    const c = covers[a.id];
    const s = seasons[a.id];
    a.tmdb = null;
    if (c?.tmdbId && c.type === "movie") {
      a.tmdb = { id: c.tmdbId, type: "movie" };
      stats.movies++;
    } else if (c?.tmdbId && c.type === "tv" && s && !s.miss) {
      const season = int(s.season, 0, 200);
      const offset = int(s.offset, 0, 5000);
      const count = int(s.count, 1, 5000);
      if (season !== null && offset !== null && count !== null) {
        a.tmdb = { id: c.tmdbId, type: "tv", season, offset, count };
        stats.tv++;
        if (validPath(s.posterPath)) stats.seasonCovers++;
      }
    }
  }
  return stats;
}
