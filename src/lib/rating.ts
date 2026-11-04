// Nota guardada em meias estrelas (1..10), como no banco (entries.rating_half).
// Exibição: 0,5 a 5, com vírgula.

export const halfToStars = (half: number) => half / 2;

export function starsToHalf(stars: number): number {
  const half = Math.round(stars * 2);
  if (half < 1 || half > 10) throw new RangeError("nota fora de 0,5–5");
  return half;
}

/** 9 → "4,5"; 10 → "5" */
export function formatRating(half: number): string {
  return halfToStars(half).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}
