// Capas do AniList (graphql.anilist.co): grátis, sem chave.
// Guardamos só o nome do arquivo da capa "extraLarge" (ex.: "/bx21-ELSYx3yMPcKM.jpg");
// o app monta a URL com ANILIST_COVER_BASE.
import { POSTER_PATH } from "./tmdb-merge.mjs";

export const ANILIST_COVER_BASE = "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large";
const ANILIST_SOURCE = /^https:\/\/anilist\.co\/anime\/(\d{1,9})$/;

/** id do AniList a partir das "sources" do anime-offline-database (ou null). */
export function anilistId(sources = []) {
  for (const s of sources) {
    const m = ANILIST_SOURCE.exec(s);
    if (m) return Number(m[1]);
  }
  return null;
}

/** URL da capa extraLarge → "/arquivo.jpg"; qualquer outra coisa → null. */
export function coverPath(url) {
  if (typeof url !== "string" || !url.startsWith(ANILIST_COVER_BASE + "/")) return null;
  const p = url.slice(ANILIST_COVER_BASE.length);
  return POSTER_PATH.test(p) ? p : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const QUERY = "query($ids:[Int]){Page(perPage:50){media(id_in:$ids,type:ANIME){id coverImage{extraLarge}}}}";

/**
 * Busca as capas dos ids que ainda não estão no cache (50 por requisição).
 * cache: { [anilistId]: "/arquivo.jpg" | null } (null = sem capa). Muta e devolve o cache.
 */
export async function fetchCovers(ids, cache) {
  const todo = [...new Set(ids)].filter((id) => !(id in cache));
  for (let i = 0; i < todo.length; i += 50) {
    const batch = todo.slice(i, i + 50);
    for (let attempt = 0; ; attempt++) {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: QUERY, variables: { ids: batch } }),
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429 && attempt < 4) {
        await sleep(Number(res.headers.get("retry-after") ?? 60) * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`AniList ${res.status}`);
      const media = (await res.json())?.data?.Page?.media ?? [];
      for (const id of batch) cache[id] = null;
      for (const m of media) if (batch.includes(m?.id)) cache[m.id] = coverPath(m.coverImage?.extraLarge);
      break;
    }
    process.stdout.write(`\rAniList: ${Math.min(i + 50, todo.length)}/${todo.length}`);
    await sleep(2100); // limite do AniList: ~30 req/min
  }
  if (todo.length) process.stdout.write("\n");
  return cache;
}
