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
  /** caminho no Storage do Supabase ("/storage/v1/object/public/avatars/<id>/…"); null = selo com a inicial */
  avatarUrl: string | null;
  /** capa do perfil (reservado: plus/dev) */
  bannerUrl: string | null;
  /** cor de destaque do perfil (reservado: plus/dev); null = carmesim */
  accent: Accent | null;
  /** cor do nome (reservado: plus/dev); null = cor normal do texto */
  nameColor: Accent | null;
  /** anime fixado no topo do perfil (reservado: plus/dev) */
  featuredAnimeId: string | null;
  featuredNote: string;
  /** definido só pelo banco; o usuário não altera */
  role: ProfileRole;
}

export type ProfileRole = "user" | "plus" | "dev";
export const ACCENTS = ["carmesim", "anil", "jade", "ambar", "sakura", "grafite"] as const;
export type Accent = (typeof ACCENTS)[number];
/** Premium ("plus" no banco): capa, cor do perfil, cor do nome, anime em destaque,
 *  sem anúncios e reviews primeiro. O dev tem tudo. */
export const isPremium = (role: ProfileRole) => role === "plus" || role === "dev";
export const canCustomize = isPremium;
/** Anúncios só para quem não é Premium (ainda não há anúncios no Aniora). */
export const showsAds = (role: ProfileRole) => !isPremium(role);
export const FEATURED_NOTE_MAX = 120;

export const EMPTY_PROFILE: LocalProfile = {
  displayName: "",
  handle: "",
  bio: "",
  avatarUrl: null,
  bannerUrl: null,
  accent: null,
  nameColor: null,
  featuredAnimeId: null,
  featuredNote: "",
  role: "user",
};

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
  profile: EMPTY_PROFILE,
}) as DiaryState;
