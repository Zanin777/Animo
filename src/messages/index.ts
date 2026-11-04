import { ptBR } from "./pt-BR";

// Um idioma por enquanto. Quando entrar EN, isto vira uma escolha por locale.
export const t = ptBR;

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const thisYear = new Date().getFullYear();
  const base = `${d} ${t.months[m - 1]}`;
  return y === thisYear ? base : `${base} ${y}`;
}
