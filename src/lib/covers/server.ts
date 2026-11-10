// SÓ NO SERVIDOR (rota /api/covers/[id]). Lê o token do TMDB de process.env.
import { cacheLife } from "next/cache";
import generated from "@/lib/catalog/catalog.generated.json";
import type { CatalogRow } from "@/lib/catalog/seed";
import { TMDB_POSTER_PATH, type CoversResponse } from "./types";

const byId = new Map((generated.anime as CatalogRow[]).map((a) => [a.id, a]));
const MAX = 24;

type Img = { file_path?: unknown; vote_average?: unknown; iso_639_1?: unknown };

/** Pôsteres oficiais do TMDB (temporada, senão a série; ou o filme). Falhou: lista vazia com cache curto. */
async function fetchPosters(path: string): Promise<string[] | null> {
  "use cache";
  const token = process.env.TMDB_READ_TOKEN;
  let out: string[] | null = null;
  if (token) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/${path}/images?include_image_language=ja,en,pt,null`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = (await res.json()) as { posters?: unknown };
        const list = Array.isArray(data.posters) ? (data.posters as Img[]) : [];
        out = list
          .filter((p) => typeof p.file_path === "string" && TMDB_POSTER_PATH.test(p.file_path))
          .sort((a, b) => Number(b.vote_average ?? 0) - Number(a.vote_average ?? 0))
          .map((p) => p.file_path as string);
      } else if (res.status === 404) out = [];
    } catch {
      // rede ou tempo esgotado
    }
  }
  if (out) cacheLife("weeks");
  else cacheLife("seconds");
  return out;
}

/** null = anime fora do catálogo. Sem id do TMDB ou sem token: lista vazia. */
export async function getCovers(animeId: string): Promise<CoversResponse | null> {
  const anime = byId.get(animeId);
  if (!anime) return null;
  const t = anime.tmdb;
  if (!t) return { animeId, posters: [] };
  const lists =
    t.type === "movie"
      ? [await fetchPosters(`movie/${t.id}`)]
      : // temporada primeiro (capas daquela temporada), depois as da série
        [await fetchPosters(`tv/${t.id}/season/${t.season}`), await fetchPosters(`tv/${t.id}`)];
  const posters = [...new Set(lists.flatMap((l) => l ?? []))].slice(0, MAX);
  return { animeId, posters };
}
