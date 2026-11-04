// Regras do diário como funções puras: estado entra, estado novo sai.
// Fáceis de testar e iguais às regras que o banco vai validar depois.
import type { Anime, NewAnimeInput } from "@/lib/catalog/provider";
import { MAX_FAVORITES, type DiaryState, type Entry, type WatchStatus } from "./types";

export interface Ctx {
  now: string; // ISO
  newId: () => string;
}

export interface NewEntryInput {
  animeId: string;
  ratingHalf: number | null;
  review?: string;
  watchedOn: string;
  isRewatch?: boolean;
}

export function addEntry(s: DiaryState, input: NewEntryInput, anime: Anime | null, ctx: Ctx): DiaryState {
  if (input.ratingHalf !== null && !(Number.isInteger(input.ratingHalf) && input.ratingHalf >= 1 && input.ratingHalf <= 10)) {
    throw new RangeError("ratingHalf deve ser 1..10 ou null");
  }
  const entry: Entry = {
    id: ctx.newId(),
    animeId: input.animeId,
    ratingHalf: input.ratingHalf,
    review: input.review?.trim() || null,
    watchedOn: input.watchedOn,
    isRewatch: input.isRewatch ?? false,
    createdAt: ctx.now,
  };
  // Registrar marca como Visto e completa os episódios.
  const prev = s.library[input.animeId];
  return {
    ...s,
    entries: [entry, ...s.entries],
    library: {
      ...s.library,
      [input.animeId]: {
        animeId: input.animeId,
        status: "watched",
        episodesWatched: anime?.episodes ?? prev?.episodesWatched ?? 0,
        updatedAt: ctx.now,
      },
    },
  };
}

export function deleteEntry(s: DiaryState, id: string): DiaryState {
  return { ...s, entries: s.entries.filter((e) => e.id !== id) };
}

export function setStatus(s: DiaryState, animeId: string, status: WatchStatus | null, ctx: Ctx): DiaryState {
  if (status === null) {
    const library = { ...s.library };
    delete library[animeId];
    return { ...s, library };
  }
  const prev = s.library[animeId];
  return {
    ...s,
    library: {
      ...s.library,
      [animeId]: {
        animeId,
        status,
        episodesWatched: prev?.episodesWatched ?? 0,
        updatedAt: ctx.now,
      },
    },
  };
}

/** +1 episódio. Ao chegar no último, vira Visto. */
export function plusOneEpisode(s: DiaryState, anime: Anime, ctx: Ctx): DiaryState {
  const prev = s.library[anime.id];
  const next = (prev?.episodesWatched ?? 0) + 1;
  const total = anime.episodes;
  if (total !== null && next > total) return s;
  const done = total !== null && next >= total;
  return {
    ...s,
    library: {
      ...s.library,
      [anime.id]: {
        animeId: anime.id,
        status: done ? "watched" : "watching",
        episodesWatched: next,
        updatedAt: ctx.now,
      },
    },
  };
}

export type FavoriteResult = { state: DiaryState; ok: true } | { state: DiaryState; ok: false; reason: "full" };

export function toggleFavorite(s: DiaryState, animeId: string): FavoriteResult {
  if (s.favorites.includes(animeId)) {
    return { ok: true, state: { ...s, favorites: s.favorites.filter((id) => id !== animeId) } };
  }
  if (s.favorites.length >= MAX_FAVORITES) return { ok: false, reason: "full", state: s };
  return { ok: true, state: { ...s, favorites: [...s.favorites, animeId] } };
}

export function createList(
  s: DiaryState,
  input: { title: string; description?: string; isRanked?: boolean },
  ctx: Ctx,
): { state: DiaryState; id: string } {
  const title = input.title.trim();
  if (!title) throw new Error("título obrigatório");
  const id = ctx.newId();
  return {
    id,
    state: {
      ...s,
      lists: [
        {
          id,
          title,
          description: input.description?.trim() || null,
          isRanked: input.isRanked ?? false,
          items: [],
          createdAt: ctx.now,
          updatedAt: ctx.now,
        },
        ...s.lists,
      ],
    },
  };
}

export function deleteList(s: DiaryState, listId: string): DiaryState {
  return { ...s, lists: s.lists.filter((l) => l.id !== listId) };
}

export function addToList(s: DiaryState, listId: string, animeId: string, ctx: Ctx): { state: DiaryState; added: boolean } {
  let added = false;
  const lists = s.lists.map((l) => {
    if (l.id !== listId || l.items.some((i) => i.animeId === animeId)) return l;
    added = true;
    return { ...l, items: [...l.items, { animeId, position: l.items.length + 1 }], updatedAt: ctx.now };
  });
  return { state: added ? { ...s, lists } : s, added };
}

export function removeFromList(s: DiaryState, listId: string, animeId: string, ctx: Ctx): DiaryState {
  return {
    ...s,
    lists: s.lists.map((l) =>
      l.id !== listId
        ? l
        : {
            ...l,
            items: l.items.filter((i) => i.animeId !== animeId).map((i, idx) => ({ ...i, position: idx + 1 })),
            updatedAt: ctx.now,
          },
    ),
  };
}

export function addCustomAnime(s: DiaryState, input: NewAnimeInput, ctx: Ctx): { state: DiaryState; anime: Anime } {
  const title = input.title.trim();
  if (!title) throw new Error("título obrigatório");
  const anime: Anime = {
    id: `u-${ctx.newId()}`,
    title,
    titleOriginal: input.titleOriginal?.trim() || null,
    aliases: [],
    year: input.year ?? null,
    kind: input.kind ?? "tv",
    episodes: input.episodes ?? null,
    isVerified: false,
  };
  return { anime, state: { ...s, customAnime: [...s.customAnime, anime] } };
}
