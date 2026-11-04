// Pôster tipográfico: mesma lógica de docs/estilo.html (direção aprovada).
// O mesmo título sempre gera o mesmo pôster.

export const POSTER_PALETTES = [
  { bg: "#1a1717", fg: "#f7f4ee", mark: "#c41e3a" },
  { bg: "#c41e3a", fg: "#fffdf9", mark: "#1a1717" },
  { bg: "#f1ebe0", fg: "#1a1717", mark: "#c41e3a" },
  { bg: "#24304a", fg: "#f1ece4", mark: "#e6b450" },
  { bg: "#2f4a3a", fg: "#f1ece4", mark: "#f1ece4" },
  { bg: "#e6b450", fg: "#1a1717", mark: "#fffdf9" },
] as const;

export type PosterVariant = "mark" | "rule" | "plain";

/** FNV-1a 32 bits, igual ao da página de estilo. */
export function hashTitle(s: string): number {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.codePointAt(0)!;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function posterStyle(title: string) {
  const h = hashTitle(title);
  const palette = POSTER_PALETTES[h % POSTER_PALETTES.length];
  const v = (h >> 4) % 3;
  const variant: PosterVariant = v === 0 ? "mark" : v === 1 ? "rule" : "plain";
  const fontSize = title.length > 22 ? 15 : title.length > 12 ? 19 : 24;
  return { palette, variant, fontSize };
}
