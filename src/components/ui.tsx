import Link from "next/link";
import type { ReactNode } from "react";
import type { Anime } from "@/lib/catalog/provider";
import { Poster } from "./Poster";

export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h1 className="font-display text-3xl leading-none md:text-4xl">{children}</h1>
      {aside}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 mb-4 border-b border-line pb-2 font-display text-lg">{children}</h2>;
}

export function Muted({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-muted ${className}`}>{children}</p>;
}

export const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-ink disabled:opacity-40 cursor-pointer";
export const btnGhost =
  "inline-flex items-center justify-center rounded-full border border-line px-3 py-1.5 text-sm hover:border-fg cursor-pointer";
export const card = "rounded-xl border border-line bg-card";
export const input =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-base outline-none focus:border-accent";

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
