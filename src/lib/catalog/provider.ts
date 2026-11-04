// Fronteira do catálogo. O app só conhece esta interface; hoje a implementação
// é o Postgres próprio (SupabaseCatalogProvider). Trocar de fonte = nova classe,
// sem mexer no resto (regra 4).

export type AnimeKind = "tv" | "movie" | "ova" | "ona" | "special";

export interface Anime {
  id: string;
  title: string;
  titleOriginal: string | null;
  year: number | null;
  kind: AnimeKind;
  episodes: number | null;
  isVerified: boolean;
}

export interface NewAnimeInput {
  title: string;
  titleOriginal?: string;
  year?: number;
  kind?: AnimeKind;
  episodes?: number;
}

export interface AnimeCatalogProvider {
  search(query: string, opts?: { limit?: number }): Promise<Anime[]>;
  getById(id: string): Promise<Anime | null>;
  /** Usuário cria um título que falta no catálogo. */
  create(input: NewAnimeInput, userId: string): Promise<Anime>;
}

/** Nota em meias estrelas (1..10) ⇄ exibição (0,5..5). */
export const halfToStars = (half: number) => half / 2;
export const starsToHalf = (stars: number) => {
  const half = Math.round(stars * 2);
  if (half < 1 || half > 10) throw new RangeError("nota fora de 0,5–5");
  return half;
};
