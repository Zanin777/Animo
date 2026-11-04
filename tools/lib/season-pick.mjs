import { POSTER_PATH } from "./tmdb-merge.mjs";

/**
 * Escolhe a temporada do TMDB para um anime do catálogo:
 * mesmo ano de estreia; senão o ano mais próximo; empate → nº de episódios
 * mais próximo. O deslocamento (offset) é calculado depois, em assignOffsets.
 */
export function chooseSeason(anime, tvSeasons) {
  const list = tvSeasons.filter((s) => s.season_number > 0 && s.episode_count > 0);
  if (!list.length) return null;
  const yearOf = (s) => Number((s.air_date ?? "").slice(0, 4)) || null;
  const yearDiff = (s) => (anime.year && yearOf(s) ? Math.abs(yearOf(s) - anime.year) : 99);
  const epDiff = (s) => (anime.episodes ? Math.abs(s.episode_count - anime.episodes) : 0);
  const pick = [...list].sort((a, b) => yearDiff(a) - yearDiff(b) || epDiff(a) - epDiff(b) || a.season_number - b.season_number)[0];
  const total = pick.episode_count;
  return {
    season: pick.season_number,
    total,
    count: anime.episodes && anime.episodes < total ? anime.episodes : total,
    offset: 0,
    posterPath: typeof pick.poster_path === "string" && POSTER_PATH.test(pick.poster_path) ? pick.poster_path : null,
  };
}

/**
 * Quando vários animes do catálogo caem na mesma temporada do TMDB
 * (ex.: "Spy x Family" e "Spy x Family Part 2"; JJK inteiro numa temporada),
 * divide os episódios em ordem de lançamento.
 * entries: [{ id, year, title, tmdbId, pick }] — muta pick.offset.
 */
export function assignOffsets(entries) {
  const groups = new Map();
  for (const e of entries) {
    const k = `${e.tmdbId}:${e.pick.season}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(e);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.title.localeCompare(b.title));
    let cum = 0;
    for (const e of list) {
      const { total, count } = e.pick;
      if (cum + count <= total) {
        e.pick.offset = cum;
        cum += count;
      } else {
        e.pick.offset = Math.max(0, total - count);
      }
    }
  }
}
