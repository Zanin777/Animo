/** Episódio como o app usa: número relativo ao anime do catálogo (1..count). */
export interface Episode {
  number: number;
  /** nome do episódio (TMDB, pt-BR quando houver); null = só o número */
  name: string | null;
  /** caminho da imagem do episódio no TMDB (ex.: "/abc.jpg") */
  still: string | null;
  /** YYYY-MM-DD */
  airDate: string | null;
  /** minutos */
  runtime: number | null;
}

export interface EpisodesResponse {
  animeId: string;
  /** "tmdb" = nomes e imagens; "numbers" = só a numeração (sem TMDB) */
  source: "tmdb" | "numbers";
  episodes: Episode[];
}

/** Mesmo formato dos pôsteres: só caminho do TMDB, nada de URL livre. */
export const STILL_PATH = /^\/[A-Za-z0-9_-]{5,64}\.(jpg|png)$/;

/** Episódios só com numeração, quando não há TMDB para este anime. */
export function numberedEpisodes(count: number): Episode[] {
  return Array.from({ length: Math.max(0, Math.min(count, 5000)) }, (_, i) => ({
    number: i + 1,
    name: null,
    still: null,
    airDate: null,
    runtime: null,
  }));
}
