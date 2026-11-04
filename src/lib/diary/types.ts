import type { Anime } from "@/lib/catalog/provider";

// Espelham as tabelas de supabase/migrations/0001_core.sql (sem user_id:
// enquanto os dados são locais, tudo é do usuário atual).

export type WatchStatus = "want" | "watching" | "watched";

export interface Entry {
  id: string;
  animeId: string;
  /** 1..10 meias estrelas; null = sem nota */
  ratingHalf: number | null;
  review: string | null;
  /** YYYY-MM-DD */
  watchedOn: string;
  isRewatch: boolean;
  createdAt: string;
}

export interface LibraryItem {
  animeId: string;
  status: WatchStatus;
  episodesWatched: number;
  updatedAt: string;
}

export interface ListItem {
  animeId: string;
  position: number;
}

export interface DiaryList {
  id: string;
  title: string;
  description: string | null;
  isRanked: boolean;
  items: ListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DiaryState {
  version: 1;
  entries: Entry[];
  library: Record<string, LibraryItem>;
  /** até 4, em ordem */
  favorites: string[];
  lists: DiaryList[];
  /** animes que o usuário adicionou ao catálogo */
  customAnime: Anime[];
  /** nota por episódio: animeId → nº do episódio → meias estrelas 1..10 */
  episodeRatings: Record<string, Record<string, number>>;
  /** perfil local (vira a tabela profiles quando houver conta) */
  profile: LocalProfile;
}

export interface LocalProfile {
  displayName: string;
  /** mesmo formato de profiles.username no banco */
  handle: string;
  bio: string;
}

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

export const MAX_FAVORITES = 4;

export const EMPTY_STATE: DiaryState = Object.freeze({
  version: 1,
  entries: [],
  library: {},
  favorites: [],
  lists: [],
  customAnime: [],
  episodeRatings: {},
  profile: { displayName: "", handle: "", bio: "" },
}) as DiaryState;
