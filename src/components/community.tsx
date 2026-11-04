"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Anime } from "@/lib/catalog/provider";
import type { AnimeStat } from "@/lib/community/types";
import { formatRating } from "@/lib/rating";
import { t } from "@/messages";
import { Hanko } from "./Hanko";
import { Poster } from "./Poster";

export function DemoBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      title={t.community.demoHint}
      className="ml-2 inline-block rounded-full border border-dashed border-accent px-2 py-0.5 align-middle font-sans text-[10px] font-bold tracking-wide text-accent uppercase"
    >
      {t.community.demo}
    </span>
  );
}

export function Tabs<K extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: [K, string][];
  value: K;
  onChange: (k: K) => void;
  label: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label={label}>
      {tabs.map(([k, text]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${value === k ? "border-accent font-bold text-accent" : "border-line"}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function Genres({ anime }: { anime: Anime }) {
  if (!anime.genres.length) return null;
  return <p className="truncate text-xs text-muted">{anime.genres.map((g) => t.genre[g] ?? g).join(" · ")}</p>;
}

/** Card do "Em alta": capa, nome, nota média, gêneros, nº de avaliações. */
export function TrendingCard({ anime, stat, extra }: { anime: Anime; stat: AnimeStat; extra?: ReactNode }) {
  return (
    <Link href={`/anime/${anime.id}`} className="poster-link w-36 flex-none snap-start sm:w-40" aria-label={anime.title}>
      <div className="poster-lift relative">
        <Poster anime={anime} />
        {stat.avgHalf !== null && (
          <span className="absolute -right-1.5 -bottom-2 z-10 rounded-full bg-bg">
            <Hanko half={Math.round(stat.avgHalf)} size="sm" />
          </span>
        )}
      </div>
      <h3 className="mt-2.5 truncate text-sm font-bold">{anime.title}</h3>
      <Genres anime={anime} />
      <p className="text-xs text-muted">{extra ?? t.community.ratings(stat.ratings)}</p>
    </Link>
  );
}

/** Linha de ranking: posição, miniatura, nome, métrica. */
export function RankRow({
  pos,
  anime,
  metric,
  half,
  title,
  href,
}: {
  pos: number;
  anime: Anime;
  metric: string;
  half?: number | null;
  title?: string;
  href?: string;
}) {
  return (
    <li>
      <Link href={href ?? `/anime/${anime.id}`} className="grid grid-cols-[28px_40px_1fr_auto] items-center gap-3 rounded-lg p-1.5 hover:bg-card">
        <span className={`text-center font-display ${pos <= 3 ? "text-xl text-accent" : "text-muted"}`}>{pos}</span>
        <Poster anime={anime} size="xs" />
        <span className="min-w-0">
          <span className="block truncate font-bold">{title ?? anime.title}</span>
          <span className="block text-xs text-muted">{metric}</span>
        </span>
        {half != null ? <span className="font-display text-accent">{formatRating(Math.round(half))}</span> : <span />}
      </Link>
    </li>
  );
}
