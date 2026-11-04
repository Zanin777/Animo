// Fronteira do catálogo. O app só conhece esta interface; hoje a implementação
// é local (seed + animes criados pelo usuário). Depois vira SupabaseCatalogProvider,
// sem mexer nas telas (regra 4).

export type AnimeKind = "tv" | "movie" | "ova" | "ona" | "special";

export interface Anime {
  id: string;
  title: string;
  titleOriginal: string | null;
  /** Outros nomes para a busca (ex.: título em inglês). */
  aliases: string[];
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
  create(input: NewAnimeInput): Promise<Anime>;
}

/** "Shingeki no Kyojin!" → "shingeki no kyojin"; tira acentos e pontuação. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Ordena por relevância: começa com a busca > contém a busca. */
export function rankMatches(list: Anime[], query: string, limit = 20): Anime[] {
  const q = normalize(query);
  if (!q) return [];
  const scored: { a: Anime; score: number }[] = [];
  for (const a of list) {
    const names = [a.title, a.titleOriginal ?? "", ...a.aliases].map(normalize);
    let score = 0;
    for (const n of names) {
      if (n === q) score = Math.max(score, 3);
      else if (n.startsWith(q)) score = Math.max(score, 2);
      else if (n.includes(q)) score = Math.max(score, 1);
    }
    if (score) scored.push({ a, score });
  }
  return scored
    .sort((x, y) => y.score - x.score || x.a.title.localeCompare(y.a.title))
    .slice(0, limit)
    .map((s) => s.a);
}
