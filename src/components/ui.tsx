import Link from "next/link";
import type { ReactNode } from "react";
import type { Anime } from "@/lib/catalog/provider";
import { Poster } from "./Poster";

// Repaginada (2026-11-05): menos caixas e pílulas. Seções se separam por espaço,
// listas por linhas finas; o carmesim marca só ação principal, nota e item ativo.

export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h1 className="font-display text-3xl leading-none md:text-4xl">{children}</h1>
      {aside}
    </div>
  );
}

/** Título de seção: Zen Kaku em negrito, sem sublinhado; à direita, uma ação opcional ("Ver tudo"). */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-12 mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-[1.15rem] leading-tight font-bold tracking-[-0.01em]">{children}</h2>
      {action && <div className="flex-none whitespace-nowrap">{action}</div>}
    </div>
  );
}

export function Muted({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-muted ${className}`}>{children}</p>;
}

export const btnPrimary =
  "press inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-ink disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer";
/** Ação secundária: sem borda; ganha fundo leve ao passar o mouse. */
export const btnGhost =
  "press inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-fg hover:bg-card disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer";
/** Link de texto para ações pequenas ("Ver catálogo completo"). */
export const linkAction = "text-sm text-muted underline decoration-line underline-offset-4 hover:text-fg hover:decoration-fg";
/** Superfície para agrupar o que precisa ficar junto (formulários, números). Sem borda. */
export const card = "rounded-lg bg-card";
export const input =
  "w-full rounded-md border border-line bg-card px-3 py-2 text-base outline-none transition-colors focus:border-accent";
/** Lista com linhas finas entre os itens (no lugar de um card por item). */
export const rows = "divide-y divide-line border-y border-line";
/** Etiqueta pequena e discreta (ex.: "revi", "visto"). */
export const tag = "inline-block rounded-sm bg-line/70 px-1.5 text-[11px] leading-[1.6] text-muted";

export function AnimeTile({ anime, caption }: { anime: Anime; caption?: ReactNode }) {
  return (
    <Link href={`/anime/${anime.id}`} className="poster-link" aria-label={anime.title}>
      <Poster anime={anime} />
      {caption && <div className="mt-1.5 text-xs text-muted">{caption}</div>}
    </Link>
  );
}

export function PosterGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">{children}</div>;
}
