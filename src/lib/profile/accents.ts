import { isPremium, type Accent, type LocalProfile } from "@/lib/diary/types";

/** Cor do nome (só vale para Premium). */
export function nameColorOf(p: LocalProfile): string | undefined {
  return isPremium(p.role) && p.nameColor ? ACCENT_COLORS[p.nameColor].color : undefined;
}

// Cores de destaque do perfil. Funcionam nos dois temas (contraste ≥ 3:1 em
// fundo escuro e claro para elementos grandes: selo, borda, botões).
export const ACCENT_COLORS: Record<Accent, { color: string; ink: string; label: string }> = {
  carmesim: { color: "#d22a45", ink: "#a51d34", label: "Carmesim" },
  anil: { color: "#4a68d8", ink: "#3550b8", label: "Anil" },
  jade: { color: "#21936f", ink: "#167558", label: "Jade" },
  ambar: { color: "#c98a1e", ink: "#a06b10", label: "Âmbar" },
  sakura: { color: "#d4628f", ink: "#b04673", label: "Sakura" },
  grafite: { color: "#7d8494", ink: "#5f6573", label: "Grafite" },
};

/** Estilo que troca o carmesim do site pela cor do perfil, só dentro do perfil. */
export function accentStyle(accent: Accent | null): React.CSSProperties | undefined {
  if (!accent) return undefined;
  const a = ACCENT_COLORS[accent];
  return { "--accent": a.color, "--accent-ink": a.ink } as React.CSSProperties;
}

/** Dourado do perfil do criador do Aniora. */
export const DEV_GOLD = "#d4a64a";
