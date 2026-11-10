// SÓ NO SERVIDOR (usado pela rota /api/synopsis/[id]). Lê o token do TMDB
// de process.env; nunca importe isto em componente "use client".
import { cacheLife } from "next/cache";
import anilistIds from "@/lib/catalog/anilist-ids.generated.json";
import generated from "@/lib/catalog/catalog.generated.json";
import type { CatalogRow } from "@/lib/catalog/seed";
import { cleanSynopsis, type SynopsisResponse } from "./clean";

const byId = new Map((generated.anime as CatalogRow[]).map((a) => [a.id, a]));
const ANILIST = anilistIds as Record<string, number>;

type Found = { text: string; lang: "pt-BR" | "en"; source: "tmdb" | "anilist" };
/** string = achou · null = a fonte respondeu e não tem sinopse · undefined = a fonte falhou */
type Fetched = string | null | undefined;

async function fromTmdb(tmdb: NonNullable<CatalogRow["tmdb"]>, token: string): Promise<Fetched> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${tmdb.type}/${tmdb.id}?language=pt-BR`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    return cleanSynopsis(((await res.json()) as { overview?: unknown }).overview);
  } catch {
    return undefined;
  }
}

const ANILIST_QUERY = "query($id:Int){Media(id:$id,type:ANIME){description(asHtml:false)}}";

async function fromAnilist(id: number): Promise<Fetched> {
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { id } }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    const data = (await res.json()) as { data?: { Media?: { description?: unknown } | null } };
    return cleanSynopsis(data.data?.Media?.description);
  } catch {
    return undefined;
  }
}

/**
 * Sinopse de um anime do catálogo, buscada sob demanda (não fica no repositório).
 * 1º TMDB em português (precisa do token e do id do TMDB); 2º AniList, em inglês.
 * Resposta boa: cache por semanas. Fonte fora do ar: cache de segundos, para a
 * próxima visita tentar de novo.
 */
async function lookup(animeId: string): Promise<Found | null> {
  "use cache";
  const anime = byId.get(animeId);
  let found: Found | null = null;
  let failed = false;

  const token = process.env.TMDB_READ_TOKEN;
  if (anime?.tmdb && token) {
    const text = await fromTmdb(anime.tmdb, token);
    if (text === undefined) failed = true;
    else if (text) found = { text, lang: "pt-BR", source: "tmdb" };
  }
  const anilist = ANILIST[animeId];
  if (!found && Number.isInteger(anilist) && anilist > 0) {
    const text = await fromAnilist(anilist);
    if (text === undefined) failed = true;
    else if (text) found = { text, lang: "en", source: "anilist" };
  }

  // uma única chamada de cacheLife por execução (regra do Next)
  if (!failed) cacheLife("weeks");
  else if (found) cacheLife("hours"); // TMDB falhou e veio a do AniList: tenta o português de novo mais tarde
  else cacheLife("seconds");
  return found;
}

export async function getSynopsis(animeId: string): Promise<SynopsisResponse | null> {
  if (!byId.has(animeId)) return null;
  const found = await lookup(animeId);
  return found ? { animeId, ...found } : { animeId, text: null, lang: null, source: null };
}
