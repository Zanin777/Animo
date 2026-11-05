// Acrescenta ao catálogo as temporadas do TMDB que ainda faltam.
// Uso: npm run fill-seasons   (depois de covers e seasons)
//
// Grava:
//   tools/tmdb-shows.json                      cache das séries (lista de temporadas)
//   src/lib/catalog/catalog.generated.json     entradas novas (marcadas extraSeason)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { buildExtraSeasons } from "./lib/extra-seasons.mjs";

const TOKEN = process.env.TMDB_READ_TOKEN;
if (!TOKEN) {
  console.error("Falta TMDB_READ_TOKEN no .env.local.");
  process.exit(1);
}
const root = new URL("..", import.meta.url);
const CATALOG = new URL("src/lib/catalog/catalog.generated.json", root);
const SHOWS = new URL("tools/tmdb-shows.json", root);
const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const shows = existsSync(SHOWS) ? JSON.parse(readFileSync(SHOWS, "utf8")) : {};
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

// remove entradas extras antigas (recalcula do zero)
catalog.anime = catalog.anime.filter((a) => !a.extraSeason);

const tvIds = [...new Set(catalog.anime.filter((a) => a.tmdb?.type === "tv").map((a) => a.tmdb.id))].filter((id) => !(id in shows));
console.log(`séries a consultar: ${tvIds.length}`);
let done = 0;
async function worker() {
  while (tvIds.length) {
    const id = tvIds.shift();
    try {
      const d = await tmdb(`tv/${id}?language=pt-BR`);
      shows[id] = {
        seasons: (d.seasons ?? []).map((s) => ({
          season_number: s.season_number,
          episode_count: s.episode_count,
          air_date: s.air_date,
          poster_path: s.poster_path,
        })),
      };
    } catch (e) {
      if (e.message === "401") {
        console.error("TMDB recusou a chave (401).");
        process.exit(1);
      }
      console.error(`\nsérie ${id}: ${e.message}`);
    }
    if (++done % 100 === 0) {
      writeFileSync(SHOWS, JSON.stringify(shows));
      process.stdout.write(`\r${done} feitas`);
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
writeFileSync(SHOWS, JSON.stringify(shows));

const extra = buildExtraSeasons(catalog.anime, shows);
catalog.anime.push(...extra);
catalog.anime.sort((x, y) => x.title.localeCompare(y.title));
writeFileSync(CATALOG, JSON.stringify(catalog) + "\n");
console.log(`\nok: ${extra.length} temporadas novas; catálogo com ${catalog.anime.length} itens`);
console.log("ex.:", extra.slice(0, 8).map((e) => e.title).join(" | "));
