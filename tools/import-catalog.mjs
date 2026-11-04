// Importa o catálogo inicial do anime-offline-database (manami-project, ODbL 1.0).
//
// Uso:
//   node tools/import-catalog.mjs <caminho/anime-offline-database-minified.json> [--limit 500]
//
// Segurança (ver docs/catalogo.md):
//   - só lê o JSON (JSON.parse); nenhum código do repositório é executado
//   - confere o SHA-256 contra o valor fixado abaixo (troca de versão = trocar o hash)
//   - limpa caracteres de controle/bidi/zero-width, respeita os limites do schema
//   - NÃO guarda imagens nem URLs de terceiros
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SOURCE = {
  name: "anime-offline-database",
  author: "manami-project",
  url: "https://github.com/manami-project/anime-offline-database",
  tag: "2026-27",
  sha256: "395BE786FB2F98F1FCA9E963911B9332110098A080E7E2569902BBC5641D1A41",
  license: "ODbL 1.0 + DbCL 1.0",
};

const root = new URL("..", import.meta.url);
const OUT = fileURLToPath(new URL("src/lib/catalog/catalog.generated.json", root));
const CURATED = JSON.parse(readFileSync(new URL("tools/catalog-curated.json", root), "utf8")).items;
// Capas do TMDB já encontradas (tools/fetch-covers.mjs). Só o caminho do pôster, validado.
const COVERS_FILE = new URL("tools/tmdb-covers.json", root);
const COVERS = existsSync(COVERS_FILE) ? JSON.parse(readFileSync(COVERS_FILE, "utf8")) : {};
const POSTER_PATH =/^\/[A-Za-z0-9_-]{5,64}\.(jpg|png)$/;

const [, , input, ...rest] = process.argv;
if (!input) {
  console.error("uso: node tools/import-catalog.mjs <arquivo.json> [--limit 500]");
  process.exit(1);
}
const li = rest.indexOf("--limit");
const LIMIT = li >= 0 ? Number(rest[li + 1]) : 2000;

// ── integridade ──
const buf = readFileSync(input);
const hash = createHash("sha256").update(buf).digest("hex").toUpperCase();
if (hash !== SOURCE.sha256) {
  console.error(`SHA-256 não confere.\n esperado ${SOURCE.sha256}\n recebido ${hash}`);
  process.exit(1);
}
const db = JSON.parse(buf.toString("utf8"));
if (!Array.isArray(db?.data)) throw new Error("formato inesperado: falta data[]");

// ── limpeza ──
const UNSAFE = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/g;
const HAS_UNSAFE = new RegExp(UNSAFE.source); // sem /g: .test() sem estado
const clean = (s) => (typeof s === "string" ? s.replace(UNSAFE, "").replace(/\s+/g, " ").trim() : "");
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const LATIN = /^[\p{Script=Latin}\p{N}\p{P}\p{S}\p{Zs}]+$/u;
const KIND = { TV: "tv", MOVIE: "movie", OVA: "ova", ONA: "ona", SPECIAL: "special" };
const intIn = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);
const slug = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "anime";

// Gêneros: lista fechada (as tags da base são livres). Ordem = prioridade
// para escolher até 3 (os mais específicos primeiro). Rótulos PT em messages.
const GENRES = [
  ["sports", ["sports"]],
  ["mecha", ["mecha"]],
  ["music", ["music"]],
  ["action", ["action"]],
  ["romance", ["romance"]],
  ["fantasy", ["fantasy"]],
  ["scifi", ["sci-fi", "science fiction", "science-fiction", "sci fi"]],
  ["mystery", ["mystery"]],
  ["horror", ["horror"]],
  ["slice-of-life", ["slice of life"]],
  ["psychological", ["psychological"]],
  ["thriller", ["thriller", "suspense"]],
  ["supernatural", ["supernatural"]],
  ["adventure", ["adventure"]],
  ["comedy", ["comedy"]],
  ["drama", ["drama"]],
];
function genresOf(tags = []) {
  const set = new Set(tags.map((t) => String(t).toLowerCase()));
  return GENRES.filter(([, names]) => names.some((n) => set.has(n))).map(([key]) => key).slice(0, 3);
}

function toAnime(a, id, extraAliases = []) {
  const title = clean(a.title);
  if (!title || title.length > 200) return null;
  const kind = KIND[a.type];
  if (!kind) return null;
  const seen = new Set([norm(title)]);
  const aliases = [];
  for (const s of [...extraAliases, ...(a.synonyms ?? [])]) {
    const c = clean(s);
    const n = norm(c);
    if (!c || c.length > 100 || seen.has(n)) continue;
    if (!extraAliases.includes(s) && !LATIN.test(c)) continue; // busca é em PT-BR: fica com alfabeto latino
    seen.add(n);
    aliases.push(c);
    if (aliases.length >= 8 + extraAliases.length) break;
  }
  const cover = COVERS[id]?.posterPath;
  return {
    id,
    title,
    aliases,
    year: intIn(a.animeSeason?.year, 1910, 2100),
    kind,
    // em exibição o total ainda não é conhecido
    episodes: a.status === "ONGOING" ? null : intIn(a.episodes, 1, 5000),
    cover: typeof cover === "string" && POSTER_PATH.test(cover) ? cover : null,
    genres: genresOf(a.tags),
  };
}

// ── curados (id fixo) ──
const out = [];
const usedIds = new Set();
const usedSrc = new Set();
for (const c of CURATED) {
  const matches = db.data.filter((a) => norm(a.title) === norm(c.match) && (!c.year || a.animeSeason?.year === c.year));
  const best = matches.sort((x, y) => y.sources.length - x.sources.length)[0];
  if (!best) {
    console.warn(`curado sem correspondência: ${c.match} (${c.year})`);
    continue;
  }
  const item = toAnime(best, c.id, c.aliases ?? []);
  if (!item) continue;
  out.push(item);
  usedIds.add(c.id);
  usedSrc.add(best);
}

// ── populares: TV/filme/ONA presentes em >= 9 sites, por nota média ──
const pool = db.data
  .filter((a) => !usedSrc.has(a) && ["TV", "MOVIE", "ONA"].includes(a.type) && a.sources.length >= 9 && a.score?.arithmeticMean && a.animeSeason?.year)
  .sort((x, y) => y.score.arithmeticMean - x.score.arithmeticMean);

for (const a of pool) {
  if (out.length >= LIMIT) break;
  let id = slug(clean(a.title));
  if (usedIds.has(id)) id = `${id}-${a.animeSeason.year}`;
  if (usedIds.has(id)) continue;
  const item = toAnime(a, id);
  if (!item) continue;
  out.push(item);
  usedIds.add(id);
}

// ── validação final: se algo fugir do schema, nada é gravado ──
for (const a of out) {
  const ok =
    /^[a-z0-9-]{1,70}$/.test(a.id) &&
    a.title.length >= 1 && a.title.length <= 200 &&
    a.aliases.every((s) => s.length <= 100 && !HAS_UNSAFE.test(s)) &&
    !HAS_UNSAFE.test(a.title) &&
    (a.year === null || (a.year >= 1910 && a.year <= 2100)) &&
    (a.episodes === null || (a.episodes >= 1 && a.episodes <= 5000)) &&
    (a.cover === null || POSTER_PATH.test(a.cover));
  if (!ok) throw new Error(`item inválido: ${JSON.stringify(a)}`);
}

out.sort((x, y) => x.title.localeCompare(y.title));
writeFileSync(OUT, JSON.stringify({ source: { ...SOURCE, lastUpdate: db.lastUpdate }, anime: out }) + "\n");
console.log(`ok: ${out.length} animes (${CURATED.length} curados, ${out.filter((a) => a.cover).length} com capa) → ${OUT}`);
