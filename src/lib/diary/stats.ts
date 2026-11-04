import type { DiaryState } from "./types";

export interface ProfileStats {
  watched: number;
  entries: number;
  thisYear: number;
  /** média em meias estrelas, ou null sem notas */
  avgHalf: number | null;
  /** índice 0 = 0,5 estrela … índice 9 = 5 estrelas */
  distribution: number[];
}

/** `year` vem de fora: nada de ler a hora aqui (roda também no prerender). */
export function computeStats(s: DiaryState, year: number | null): ProfileStats {
  const distribution = Array<number>(10).fill(0);
  let sum = 0;
  let rated = 0;
  let thisYear = 0;
  for (const e of s.entries) {
    if (year !== null && e.watchedOn.startsWith(`${year}-`)) thisYear++;
    if (e.ratingHalf !== null) {
      distribution[e.ratingHalf - 1]++;
      sum += e.ratingHalf;
      rated++;
    }
  }
  return {
    watched: Object.values(s.library).filter((l) => l.status === "watched").length,
    entries: s.entries.length,
    thisYear,
    avgHalf: rated ? sum / rated : null,
    distribution,
  };
}
