// SÓ NO SERVIDOR (usado pela rota /api/episodes/[id]). Lê o token do TMDB
// de process.env; nunca importe isto em componente "use client".
import { cacheLife } from "next/cache";
import generated from "@/lib/catalog/catalog.generated.json";
import type { CatalogRow } from "@/lib/catalog/seed";
import { STILL_PATH, numberedEpisodes, type Episode, type EpisodesResponse } from "./types";

const UNSAFE = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/g;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const byId = new Map((generated.anime as CatalogRow[]).map((a) => [a.id, a]));

export const ANIME_ID = /^[a-z0-9-]{1,70}$/;

type TmdbEpisode = { episode_number?: unknown; name?: unknown; still_path?: unknown; air_date?: unknown; runtime?: unknown };

/** Uma temporada do TMDB, em cache por semanas (a lista de episódios quase não muda). */
async function fetchSeason(tvId: number, season: number): Promise<TmdbEpisode[] | null> {
  "use cache";
  cacheLife("weeks");
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) return null;
  const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${season}?language=pt-BR`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { episodes?: unknown };
  return Array.isArray(data.episodes) ? (data.episodes as TmdbEpisode[]) : null;
}

function clean(e: TmdbEpisode, number: number): Episode {
  const name = typeof e.name === "string" ? e.name.replace(UNSAFE, "").replace(/\s+/g, " ").trim().slice(0, 200) : "";
  return {
    number,
    // o TMDB devolve "Episódio 12" quando não há tradução: tratamos como sem nome
    name: name && !/^epis[oó]dio\s+\d+$/i.test(name) ? name : null,
    still: typeof e.still_path === "string" && STILL_PATH.test(e.still_path) ? e.still_path : null,
    airDate: typeof e.air_date === "string" && DATE.test(e.air_date) ? e.air_date : null,
    runtime: Number.isInteger(e.runtime) && (e.runtime as number) > 0 && (e.runtime as number) < 600 ? (e.runtime as number) : null,
  };
}

export async function getEpisodes(animeId: string): Promise<EpisodesResponse | null> {
  const anime = byId.get(animeId);
  if (!anime) return null;
  const tmdb = anime.tmdb;
  if (!tmdb || tmdb.type !== "tv") {
    // filmes não têm episódios; série sem TMDB fica só com a numeração
    return { animeId, source: "numbers", episodes: anime.kind === "movie" ? [] : numberedEpisodes(anime.episodes ?? 0) };
  }
  const raw = await fetchSeason(tmdb.id, tmdb.season);
  if (!raw) return { animeId, source: "numbers", episodes: numberedEpisodes(anime.episodes ?? tmdb.count) };
  const slice = raw
    .filter((e) => Number.isInteger(e.episode_number))
    .sort((a, b) => (a.episode_number as number) - (b.episode_number as number))
    .slice(tmdb.offset, tmdb.offset + tmdb.count);
  return { animeId, source: "tmdb", episodes: slice.map((e, i) => clean(e, i + 1)) };
}
