// Busca a capa de cada anime do catálogo no TMDB e grava só o caminho do pôster.
//
// Uso (a chave fica em .env.local, nunca no código):
//   npm run covers                 # busca só quem ainda não foi procurado
//   npm run covers -- --retry      # tenta de novo quem não foi achado
//
// O que é gravado:
//   tools/tmdb-covers.json         cache { id: { tmdbId, type, posterPath } | { miss: true } }
//   src/lib/catalog/catalog.generated.json   campo "cover" atualizado
//
// Regras: só resultados de Animação (gênero 16) de origem japonesa; o caminho
// do pôster é validado por regex antes de entrar no catálogo.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const TOKEN = process.env.TMDB_READ_TOKEN;
if (!TOKEN) {
  console.error("Falta TMDB_READ_TOKEN no .env.local (o \"Token de Leitura da API\" do TMDB).");
  process.exit(1);
}
const RETRY = process.argv.includes("--retry");

const root = new URL("..", import.meta.url);
const CATALOG = new URL("src/lib/catalog/catalog.generated.json", root);
const CACHE = new URL("tools/tmdb-covers.json", root);
const POSTER_PATH = /^\/[A-Za-z0-9_-]{5,64}\.(jpg|png)$/;

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tmdb(path, params) {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, String(v));
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (res.status === 401) throw new Error("TMDB recusou a chave (401). Confira o TMDB_READ_TOKEN.");
    if (!res.ok) throw new Error(`TMDB ${res.status} em ${path}`);
    return res.json();
  }
  throw new Error("TMDB: muitas tentativas (429)");
}

// "Shingeki no Kyojin Season 3 Part 2" → "Shingeki no Kyojin"
function baseTitle(t) {
  return t
    .replace(/\s*[:\-–]?\s*(\d+(st|nd|rd|th)\s+season|season\s+\d+|part\s+\d+|\d+(st|nd|rd|th)\s+cour|final season.*|the final.*|movie.*|kanketsu-hen.*)$/i, "")
    .replace(/\s+(II|III|IV|2|3|4)$/, "")
    .replace(/[°'’.!]+$/, "")
    .trim();
}

function pick(results) {
  return results.find(
    (r) => r.poster_path && POSTER_PATH.test(r.poster_path) && r.genre_ids?.includes(16) &&
      (r.original_language === "ja" || r.origin_country?.includes("JP")),
  );
}

async function find(a) {
  const isMovie = a.kind === "movie";
  const path = isMovie ? "search/movie" : "search/tv";
  const yearKey = isMovie ? "primary_release_year" : "first_air_date_year";
  const names = [...new Set([a.title, ...a.aliases.slice(0, 3), baseTitle(a.title)])].filter(Boolean);
  // 1º com ano, depois sem ano (temporadas novas de séries antigas)
  for (const withYear of [true, false]) {
    for (const query of names) {
      const r = await tmdb(path, { query, [yearKey]: withYear ? a.year : null, include_adult: false, language: "pt-BR" });
      const hit = pick(r.results ?? []);
      if (hit) return { tmdbId: hit.id, type: isMovie ? "movie" : "tv", posterPath: hit.poster_path };
      await sleep(30);
    }
  }
  return { miss: true };
}

const todo = catalog.anime.filter((a) => !(a.id in cache) || (RETRY && cache[a.id]?.miss));
console.log(`procurando ${todo.length} de ${catalog.anime.length}…`);

let done = 0;
const CONCURRENCY = 4;
async function worker() {
  while (todo.length) {
    const a = todo.shift();
    try {
      cache[a.id] = await find(a);
    } catch (e) {
      console.error(`\n${a.title}: ${e.message}`);
      if (String(e.message).includes("401")) process.exit(1);
    }
    if (++done % 50 === 0) {
      writeFileSync(CACHE, JSON.stringify(cache, null, 0));
      process.stdout.write(`\r${done} feitos`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
writeFileSync(CACHE, JSON.stringify(cache, null, 0));

// junta no catálogo
let withCover = 0;
for (const a of catalog.anime) {
  const p = cache[a.id]?.posterPath;
  a.cover = typeof p === "string" && POSTER_PATH.test(p) ? p : null;
  if (a.cover) withCover++;
}
writeFileSync(CATALOG, JSON.stringify(catalog) + "\n");
const misses = catalog.anime.filter((a) => cache[a.id]?.miss).map((a) => a.title);
console.log(`\nok: ${withCover} de ${catalog.anime.length} com capa. Sem capa (pôster tipográfico): ${misses.length}`);
if (misses.length) console.log("ex.:", misses.slice(0, 15).join(" | "));
