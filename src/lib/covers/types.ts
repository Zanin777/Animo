/** Caminho de pôster do TMDB ("/abc123.jpg"). Validado em todo lugar: rota, tela e banco. */
export const TMDB_POSTER_PATH = /^\/[A-Za-z0-9_-]{5,64}\.(jpg|png)$/;
/** Tamanho usado para capas trocadas (pôsteres do TMDB). next.config.ts só aceita este. */
export const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w342";

export interface CoversResponse {
  animeId: string;
  /** capas oficiais do TMDB para este anime/temporada, mais votadas primeiro */
  posters: string[];
}
