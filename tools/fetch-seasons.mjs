// Descobre a temporada do TMDB de cada anime de TV (o TMDB junta temporadas
// numa série só) e grava: nº da temporada, deslocamento de episódios e a capa
// daquela temporada.
//
// Uso: npm run seasons          (depois de npm run covers)
//
// Grava:
//   tools/tmdb-seasons.json                    cache { animeId: { season, offset, count, posterPath } | { miss } }
//   src/lib/catalog/catalog.generated.json     campos "tmdb" e "cover" atualizados
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { assignOffsets, chooseSeason } from "./lib/season-pick.mjs";
import { applyTmdb } from "./lib/tmdb-merge.mjs";

const TOKEN = process.env.TMDB_READ_TOKEN;
if (!TOKEN) {
  console.error("Falta TMDB_READ_TOKEN no .env.local.");
  process.exit(1);
}
const root = new URL("..", import.meta.url);
const CATALOG = new URL("src/lib/catalog/catalog.generated.json", root);
const COVERS = new URL("tools/tmdb-covers.json", root);
const SEASONS = new URL("tools/tmdb-seasons.json", root);

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const covers = JSON.parse(readFileSync(COVERS, "utf8"));
const seasons = existsSync(SEASONS) ? JSON.parse(readFileSync(SEASONS, "utf8")) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tmdb(path) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`https://api.themoviedb.org/3/${path}`, {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (res.status === 401) throw new Error("401");
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return res.json();
  }
  throw new Error("429");
}

const tvIds = catalog.anime.filter((a) => covers[a.id]?.type === "tv" && !(a.id in seasons));
console.log(`temporadas a descobrir: ${tvIds.length}`);
const showCache = new Map();
let done = 0;
async function worker() {
  while (tvIds.length) {
    const a = tvIds.shift();
    const showId = covers[a.id].tmdbId;
    try {
      if (!showCache.has(showId)) showCache.set(showId, tmdb(`tv/${showId}?language=pt-BR`));
      const show = await showCache.get(showId);
      seasons[a.id] = chooseSeason(a, show.seasons ?? []) ?? { miss: true };
    } catch (e) {
      if (e.message === "401") {
        console.error("TMDB recusou a chave (401).");
        process.exit(1);
      }
      console.error(`\n${a.title}: ${e.message}`);
    }
    if (++done % 100 === 0) {
      writeFileSync(SEASONS, JSON.stringify(seasons));
      process.stdout.write(`\r${done} feitos`);
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));

// divide episódios entre animes que caíram na mesma temporada
assignOffsets(
  catalog.anime
    .filter((a) => seasons[a.id] && !seasons[a.id].miss)
    .map((a) => ({ id: a.id, year: a.year, title: a.title, tmdbId: covers[a.id].tmdbId, pick: seasons[a.id] })),
);
writeFileSync(SEASONS, JSON.stringify(seasons));

const stats = applyTmdb(catalog.anime, covers, seasons);
writeFileSync(CATALOG, JSON.stringify(catalog) + "\n");
console.log(`\nok: ${stats.tv} séries com temporada, ${stats.seasonCovers} com capa da temporada, ${stats.movies} filmes`);
