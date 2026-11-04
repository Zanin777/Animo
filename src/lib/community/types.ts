// Dados da comunidade (de várias pessoas). Hoje vêm de demo.ts em
// desenvolvimento; depois, de consultas agregadas no Supabase com o mesmo formato.

export interface CommunityUser {
  handle: string;
}

/** Um registro de alguém: base de todas as agregações. */
export interface CommunityEvent {
  user: string; // handle
  animeId: string;
  /** 1..10 ou null */
  ratingHalf: number | null;
  review: string | null;
  /** minutos atrás */
  minutesAgo: number;
}

/** Alguém viu (e talvez deu nota a) um episódio. */
export interface EpisodeEvent {
  user: string;
  animeId: string;
  episode: number;
  ratingHalf: number | null;
}

export interface EpisodeStat {
  animeId: string;
  episode: number;
  avgHalf: number | null;
  ratings: number;
  watchers: number;
}

export interface AnimeStat {
  animeId: string;
  avgHalf: number | null;
  ratings: number;
  /** pessoas diferentes que registraram */
  watchers: number;
  /** registros nos últimos 7 dias */
  recent: number;
}

export type ActivityItem =
  | { kind: "completed"; user: string; animeId: string; minutesAgo: number }
  | { kind: "rated"; user: string; animeId: string; ratingHalf: number; minutesAgo: number }
  | { kind: "reviewed"; user: string; animeId: string; ratingHalf: number | null; review: string; minutesAgo: number }
  | { kind: "list"; user: string; listId: string; listTitle: string; minutesAgo: number };

export interface PublicList {
  id: string;
  title: string;
  author: string;
  animeIds: string[];
  likes: number;
  minutesAgo: number;
}

export interface CommunitySnapshot {
  /** true = dados inventados (só em desenvolvimento) */
  demo: boolean;
  events: CommunityEvent[];
  episodeEvents: EpisodeEvent[];
  /** quem o usuário atual segue */
  following: string[];
  lists: PublicList[];
}
