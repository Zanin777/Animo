// Monta entradas de catálogo para temporadas do TMDB que ainda não existem
// no catálogo (ex.: só temos a T1 de uma série que tem T1..T4).

const slug = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "anime";

const SEQUEL_TAIL =
  /\s*[:\-–]?\s*(\(\d{4}\)|\d+(st|nd|rd|th)\s+season\b.*|season\s+\d+.*|part\s+\d+.*|\d+(st|nd|rd|th)\s+cour.*|(the\s+)?final\s+season.*|(II|III|IV|V|VI|2|3|4|5|6)[°'’.!]*)$/i;

/** "Ani ni Tsukeru Kusuri wa Nai! 2" → "Ani ni Tsukeru Kusuri wa Nai!" (nome da série). */
export function seriesTitle(title) {
  let t = title.trim();
  for (let i = 0; i < 3; i++) {
    const next = t.replace(SEQUEL_TAIL, "").trim();
    if (next === t || !next) break;
    t = next;
  }
  return t || title;
}

/**
 * anime: itens do catálogo (com .tmdb)
 * shows: { [tmdbId]: { seasons: [{ season_number, episode_count, air_date, poster_path }] } }
 * Devolve as entradas novas (não muta o catálogo).
 */
export function buildExtraSeasons(anime, shows) {
  const ids = new Set(anime.map((a) => a.id));
  const byShow = new Map();
  for (const a of anime) {
    if (a.tmdb?.type !== "tv") continue;
    if (!byShow.has(a.tmdb.id)) byShow.set(a.tmdb.id, []);
    byShow.get(a.tmdb.id).push(a);
  }
  const extra = [];
  for (const [tmdbId, entries] of byShow) {
    const show = shows[tmdbId];
    if (!show?.seasons) continue;
    const covered = new Set(entries.map((e) => e.tmdb.season));
    // a "base" é a primeira temporada que temos (nome e gêneros da série)
    const base = [...entries].sort((x, y) => x.tmdb.season - y.tmdb.season || x.tmdb.offset - y.tmdb.offset)[0];
    const baseTitle = seriesTitle(base.title);
    for (const s of show.seasons) {
      const n = s.season_number;
      if (!Number.isInteger(n) || n < 1 || covered.has(n)) continue;
      const count = Number.isInteger(s.episode_count) ? s.episode_count : 0;
      if (count < 1 || count > 5000) continue;
      const year = Number((s.air_date ?? "").slice(0, 4)) || null;
      let id = `${slug(baseTitle).slice(0, 50).replace(/-$/, "")}-temporada-${n}`;
      while (ids.has(id)) id = `${id}-x`;
      ids.add(id);
      extra.push({
        id,
        title: `${baseTitle} (Temporada ${n})`,
        aliases: [],
        year: year && year >= 1910 && year <= 2100 ? year : null,
        kind: "tv",
        episodes: count,
        cover: base.cover ?? null, // capa da série (AniList)
        genres: base.genres ?? [],
        tmdb: { id: tmdbId, type: "tv", season: n, offset: 0, count },
        extraSeason: true,
      });
    }
  }
  return extra;
}
