// Regras do diário como funções puras: estado entra, estado novo sai.
// Fáceis de testar e iguais às regras que o banco vai validar depois.
import type { Anime, NewAnimeInput } from "@/lib/catalog/provider";
import { ACCENTS, FEATURED_NOTE_MAX, HANDLE_RE, MAX_FAVORITES, canCustomize, type DiaryState, type Entry, type LocalProfile, type WatchStatus } from "./types";

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

export type ProfileError = "handle" | "displayName" | "bio" | "accent" | "featuredNote" | "reserved";

/** Atualiza o perfil local com as mesmas regras do banco (profiles). */
export type ProfileInput = Pick<LocalProfile, "displayName" | "handle" | "bio"> &
  Partial<Pick<LocalProfile, "avatarUrl" | "bannerUrl" | "accent" | "nameColor" | "featuredAnimeId" | "featuredNote">>;

export function updateProfile(s: DiaryState, input: ProfileInput): { state: DiaryState; error: ProfileError | null } {
  const displayName = input.displayName.trim();
  const handle = input.handle.trim().toLowerCase().replace(/^@/, "");
  const bio = input.bio.trim();
  if (handle && !HANDLE_RE.test(handle)) return { state: s, error: "handle" };
  if (displayName.length > 50) return { state: s, error: "displayName" };
  if (bio.length > 300) return { state: s, error: "bio" };
  const prev = s.profile;
  const next: LocalProfile = { ...prev, displayName, handle, bio };
  if (input.avatarUrl !== undefined) next.avatarUrl = input.avatarUrl;
  // recursos reservados: só plus/dev (o banco também recusa)
  const reserved = input.bannerUrl !== undefined || input.accent !== undefined || input.nameColor !== undefined || input.featuredAnimeId !== undefined || input.featuredNote !== undefined;
  if (reserved && !canCustomize(prev.role)) return { state: s, error: "reserved" };
  if (input.bannerUrl !== undefined) next.bannerUrl = input.bannerUrl;
  if (input.accent !== undefined) {
    if (input.accent !== null && !(ACCENTS as readonly string[]).includes(input.accent)) return { state: s, error: "accent" };
    next.accent = input.accent;
  }
  if (input.nameColor !== undefined) {
    if (input.nameColor !== null && !(ACCENTS as readonly string[]).includes(input.nameColor)) return { state: s, error: "accent" };
    next.nameColor = input.nameColor;
  }
  if (input.featuredAnimeId !== undefined) next.featuredAnimeId = input.featuredAnimeId;
  if (input.featuredNote !== undefined) {
    const note = input.featuredNote.trim();
    if (note.length > FEATURED_NOTE_MAX) return { state: s, error: "featuredNote" };
    next.featuredNote = note;
  }
  return { state: { ...s, profile: next }, error: null };
}

/** Nota de um episódio (1..10); null tira a nota. */
export function rateEpisode(s: DiaryState, animeId: string, episode: number, ratingHalf: number | null): DiaryState {
  if (!Number.isInteger(episode) || episode < 1 || episode > 5000) throw new RangeError("episódio inválido");
  if (ratingHalf !== null && !(Number.isInteger(ratingHalf) && ratingHalf >= 1 && ratingHalf <= 10)) {
    throw new RangeError("ratingHalf deve ser 1..10 ou null");
  }
  const forAnime = { ...(s.episodeRatings[animeId] ?? {}) };
  if (ratingHalf === null) delete forAnime[episode];
  else forAnime[episode] = ratingHalf;
  const episodeRatings = { ...s.episodeRatings };
  if (Object.keys(forAnime).length) episodeRatings[animeId] = forAnime;
  else delete episodeRatings[animeId];
  return { ...s, episodeRatings };
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
    cover: null,
    genres: [],
    tmdb: null,
    isVerified: false,
  };
  return { anime, state: { ...s, customAnime: [...s.customAnime, anime] } };
}
