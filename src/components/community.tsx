"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Anime } from "@/lib/catalog/provider";
import type { AnimeStat } from "@/lib/community/types";
import { t } from "@/messages";
import { Hanko } from "./Hanko";
import { Poster } from "./Poster";

export function DemoBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      title={t.community.demoHint}
      className="ml-2 align-middle text-xs font-normal text-muted underline decoration-dotted decoration-1 underline-offset-4"
    >
      {t.community.demoShort}
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
  const ref = useRef<HTMLDivElement>(null);
  // abas que não cabem (celular): a ponta direita esmaece até chegar no fim
  const [more, setMore] = useState(false);
  const update = useCallback(() => {
    const el = ref.current;
    if (el) setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  return (
    <div
      ref={ref}
      onScroll={update}
      className="no-scrollbar mb-4 flex gap-5 overflow-x-auto border-b border-line"
      style={more ? { maskImage: "linear-gradient(to right, #000 80%, transparent)", WebkitMaskImage: "linear-gradient(to right, #000 80%, transparent)" } : undefined}
      role="tablist"
      aria-label={label}
    >
      {tabs.map(([k, text]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          className={`-mb-px flex-none cursor-pointer border-b-2 pb-2 text-sm whitespace-nowrap transition-colors ${
            value === k ? "border-active font-bold text-fg" : "border-transparent text-muted hover:text-fg"
          }`}
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
/** stat ausente = destaque do catálogo (sem notas da comunidade): mostra ano e formato. */
export function TrendingCard({ anime, stat, extra }: { anime: Anime; stat?: AnimeStat; extra?: ReactNode }) {
  return (
    <Link href={`/anime/${anime.id}`} className="poster-link w-36 flex-none snap-start sm:w-40" aria-label={anime.title}>
      <div className="poster-lift relative">
        <Poster anime={anime} />
        {stat && stat.avgHalf !== null && (
          <span className="absolute -right-1.5 -bottom-2 z-10 rounded-full bg-bg">
            <Hanko half={Math.round(stat.avgHalf)} size="sm" />
          </span>
        )}
      </div>
      <h3 className="mt-2.5 truncate text-sm font-bold">{anime.title}</h3>
      <Genres anime={anime} />
      <p className="text-xs text-muted">
        {extra ?? (stat ? t.community.ratings(stat.ratings) : [anime.year, t.kind[anime.kind]].filter(Boolean).join(" · "))}
      </p>
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
      <Link href={href ?? `/anime/${anime.id}`} className="grid grid-cols-[28px_36px_1fr_auto] items-center gap-3 py-2.5 transition-colors hover:bg-card">
        <span className={`text-center font-display tabular-nums ${pos <= 3 ? "text-lg text-fg" : "text-muted"}`}>{pos}</span>
        <Poster anime={anime} size="xs" />
        <span className="min-w-0">
          <span className="block truncate font-bold">{title ?? anime.title}</span>
          <span className="block text-xs text-muted">{metric}</span>
        </span>
        {half != null ? <Hanko half={Math.round(half)} size="sm" /> : <span />}
      </Link>
    </li>
  );
}
