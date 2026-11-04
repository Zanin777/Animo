// Gera supabase/seed/anime-N.sql a partir do catálogo do app, para colar no SQL Editor.
// Uso: node tools/build-seed-sql.mjs
// Pode rodar de novo quando o catálogo mudar: usa "on conflict do update".
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const { anime, source } = JSON.parse(readFileSync(new URL("src/lib/catalog/catalog.generated.json", root), "utf8"));
const OUT = new URL("supabase/seed/", root);
const PER_FILE = 500;

const ID = /^[a-z0-9-]{1,80}$/;
const KIND = new Set(["tv", "movie", "ova", "ona", "special"]);
const PATH = /^\/[A-Za-z0-9_-]{5,64}\.(jpg|png)$/;

// Texto SQL: aspas simples dobradas; o catálogo já vem sem caracteres de controle.
const str = (s) => (s == null ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const num = (n) => (Number.isInteger(n) ? String(n) : "null");
const arr = (xs) => `array[${xs.map(str).join(",")}]::text[]`;

function row(a) {
  if (!ID.test(a.id) || !KIND.has(a.kind)) throw new Error(`item inválido: ${a.id}`);
  const t = a.tmdb ?? {};
  return `(${[
    str(a.id),
    str(a.title),
    arr(a.aliases ?? []),
    arr(a.genres ?? []),
    num(a.year),
    `'${a.kind}'`,
    num(a.episodes),
    a.cover && PATH.test(a.cover) ? str(a.cover) : "null",
    num(t.id),
    t.type === "tv" || t.type === "movie" ? `'${t.type}'` : "null",
    num(t.season),
    num(t.offset),
    num(t.count),
    "true",
  ].join(", ")})`;
}

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (/^anime-\d+\.sql$/.test(f)) rmSync(new URL(f, OUT));

const files = Math.ceil(anime.length / PER_FILE);
for (let i = 0; i < files; i++) {
  const chunk = anime.slice(i * PER_FILE, (i + 1) * PER_FILE);
  const sql = `-- Catálogo Aniora ${i + 1}/${files} (${chunk.length} animes).
-- Fonte: ${source.name} (${source.author}), ${source.license}. Capas/temporadas: TMDB.
-- Gerado por tools/build-seed-sql.mjs — não editar à mão.
insert into public.anime
  (id, title, aliases, genres, year, kind, episodes, cover_path, tmdb_id, tmdb_type, tmdb_season, tmdb_offset, tmdb_count, is_verified)
values
${chunk.map(row).join(",\n")}
on conflict (id) do update set
  title = excluded.title, aliases = excluded.aliases, genres = excluded.genres, year = excluded.year,
  kind = excluded.kind, episodes = excluded.episodes, cover_path = excluded.cover_path,
  tmdb_id = excluded.tmdb_id, tmdb_type = excluded.tmdb_type, tmdb_season = excluded.tmdb_season,
  tmdb_offset = excluded.tmdb_offset, tmdb_count = excluded.tmdb_count, is_verified = true;
`;
  writeFileSync(new URL(`anime-${i + 1}.sql`, OUT), sql);
}
console.log(`ok: ${anime.length} animes em ${files} arquivos (supabase/seed/anime-1..${files}.sql)`);
