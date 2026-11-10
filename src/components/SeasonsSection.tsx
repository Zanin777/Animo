"use client";

import type { SeasonTab } from "@/lib/catalog/seasons";
import { useDiary } from "@/lib/diary/store";
import { t } from "@/messages";
import { Poster } from "./Poster";
import { SectionTitle } from "./ui";

/**
 * Seletor de temporadas da série (T1, T2, T3…). A página mostra os episódios,
 * o status e as reviews da temporada escolhida; cada temporada guarda as próprias notas.
 */
export function SeasonsSection({
  seasons,
  selectedId,
  onSelect,
}: {
  seasons: SeasonTab[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const state = useDiary();
  const selected = seasons.find((s) => s.anime.id === selectedId) ?? seasons[0];

  return (
    <section>
      <SectionTitle>
        {t.seasons.title}
        <span className="ml-2 font-sans text-sm font-normal text-muted">{seasons.length}</span>
      </SectionTitle>

      <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pt-1 pb-3 no-scrollbar" role="tablist" aria-label={t.seasons.title}>
        {seasons.map((s) => {
          const on = s.anime.id === selected.anime.id;
          const rated = Object.keys(state.episodeRatings[s.anime.id] ?? {}).length;
          const status = state.library[s.anime.id]?.status;
          return (
            <button
              key={s.anime.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={t.seasons.long(s.season, s.part)}
              onClick={() => onSelect(s.anime.id)}
              className={`press flex w-20 flex-none cursor-pointer snap-start flex-col items-stretch gap-1.5 rounded-md p-1 text-left transition-colors sm:w-24 ${
                on ? "bg-card" : "hover:bg-card"
              }`}
            >
              <Poster
                anime={s.anime}
                size="xs"
                className={`transition-opacity ${on ? "outline-2 outline-offset-2 outline-active" : "opacity-60"}`}
              />
              <span className={`text-xs leading-tight ${on ? "font-bold text-fg" : "text-muted"}`}>{t.seasons.short(s.season, s.part)}</span>
              <span className="text-[10px] leading-tight text-muted">
                {t.seasons.eps(s.anime.episodes)}
                {status && ` · ${t.status[status]}`}
                {rated > 0 && ` · ★${rated}`}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-sm">
        <span className="font-bold">{t.seasons.long(selected.season, selected.part)}</span>
        {selected.anime.year && <span className="text-muted"> · {selected.anime.year}</span>}
        {selected.anime.episodes && <span className="text-muted"> · {t.anime.episodes(selected.anime.episodes)}</span>}
      </p>
    </section>
  );
}
