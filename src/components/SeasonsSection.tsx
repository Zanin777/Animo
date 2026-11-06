"use client";

import Link from "next/link";
import { useState } from "react";
import type { Anime } from "@/lib/catalog/provider";
import { useCatalog } from "@/lib/catalog/local";
import { seasonsOf } from "@/lib/catalog/seasons";
import { useDiary } from "@/lib/diary/store";
import { t } from "@/messages";
import { EpisodeList } from "./EpisodeList";
import { Poster } from "./Poster";
import { SectionTitle } from "./ui";

/**
 * Temporadas da série (abas T1, T2, T3…) com os episódios de cada uma.
 * Cada temporada guarda as próprias notas (é um item do catálogo).
 * Sem outras temporadas, mostra só os episódios deste anime.
 */
export function SeasonsSection({ anime }: { anime: Anime }) {
  const catalog = useCatalog();
  const state = useDiary();
  const tabs = seasonsOf(anime, catalog.all);
  const [selectedId, setSelectedId] = useState(anime.id);

  if (tabs.length === 0) return <EpisodeList anime={anime} />;

  const selected = tabs.find((x) => x.anime.id === selectedId) ?? tabs.find((x) => x.anime.id === anime.id) ?? tabs[0];

  return (
    <section>
      <SectionTitle>
        {t.seasons.title}
        <span className="ml-2 font-sans text-sm font-normal text-muted">{tabs.length}</span>
      </SectionTitle>

      <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pt-1 pb-3" role="tablist" aria-label={t.seasons.title}>
        {tabs.map((s) => {
          const on = s.anime.id === selected.anime.id;
          const rated = Object.keys(state.episodeRatings[s.anime.id] ?? {}).length;
          return (
            <button
              key={s.anime.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={t.seasons.long(s.season, s.part)}
              onClick={() => setSelectedId(s.anime.id)}
              className={`press flex w-20 flex-none cursor-pointer snap-start flex-col items-stretch gap-1.5 rounded-md p-1 text-left transition-colors sm:w-24 ${
                on ? "bg-card" : "hover:bg-card"
              }`}
            >
              <Poster anime={s.anime} size="xs" className={on ? "outline-2 outline-offset-2 outline-accent" : "opacity-60"} />
              <span className={`text-xs leading-tight ${on ? "font-bold text-fg" : "text-muted"}`}>{t.seasons.short(s.season, s.part)}</span>
              <span className="text-[10px] leading-tight text-muted">
                {t.seasons.eps(s.anime.episodes)}
                {rated > 0 && ` · ★${rated}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm">
          <span className="font-bold">{t.seasons.long(selected.season, selected.part)}</span>
          {selected.anime.year && <span className="text-muted"> · {selected.anime.year}</span>}
        </p>
        {selected.anime.id !== anime.id && (
          <Link href={`/anime/${selected.anime.id}`} className="text-sm text-accent underline">
            {t.seasons.open}
          </Link>
        )}
      </div>

      <EpisodeList key={selected.anime.id} anime={selected.anime} />
    </section>
  );
}
