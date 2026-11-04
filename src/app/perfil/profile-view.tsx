"use client";

import { useState } from "react";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { AnimeTile, Muted, PageTitle, PosterGrid, SectionTitle, card } from "@/components/ui";
import { useCatalog } from "@/lib/catalog/local";
import { computeStats } from "@/lib/diary/stats";
import { useDiary } from "@/lib/diary/store";
import { MAX_FAVORITES, type WatchStatus } from "@/lib/diary/types";
import { formatRating } from "@/lib/rating";
import { useCurrentYear } from "@/lib/use-current-year";
import { t } from "@/messages";

const TABS: WatchStatus[] = ["watched", "watching", "want"];

export function ProfileView() {
  const state = useDiary();
  const catalog = useCatalog();
  const stats = computeStats(state, useCurrentYear());
  const [tab, setTab] = useState<WatchStatus>("watched");
  const maxBar = Math.max(1, ...stats.distribution);

  const shelf = Object.values(state.library)
    .filter((l) => l.status === tab)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((l) => catalog.get(l.animeId))
    .filter((a) => a !== null);

  return (
    <>
      <PageTitle aside={<ThemeSwitch />}>{t.profile.you}</PageTitle>
      <Muted className="-mt-3">{t.profile.localNotice}</Muted>

      <SectionTitle>{t.profile.favorites}</SectionTitle>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: MAX_FAVORITES }, (_, i) => {
          const a = state.favorites[i] ? catalog.get(state.favorites[i]) : null;
          return a ? (
            <AnimeTile key={a.id} anime={a} />
          ) : (
            <div key={i} className="aspect-[2/3] rounded-lg border border-dashed border-line" />
          );
        })}
      </div>
      {state.favorites.length === 0 && <Muted className="mt-2">{t.profile.favoritesEmpty}</Muted>}

      <SectionTitle>{t.profile.stats}</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={stats.watched} label={t.profile.statWatched} />
        <Stat value={stats.entries} label={t.profile.statEntries} />
        <Stat value={stats.thisYear} label={t.profile.statThisYear} />
        <Stat value={stats.avgHalf === null ? "–" : formatRating(Math.round(stats.avgHalf * 10) / 10)} label={t.profile.statAvg} />
      </div>

      <div className={`${card} mt-3 p-4`}>
        <div className="mb-2 text-sm text-muted">{t.profile.distribution}</div>
        <div className="flex h-20 items-end gap-1" aria-label={t.profile.distribution}>
          {stats.distribution.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${formatRating(i + 1)}: ${n}`}>
              <div
                className="w-full rounded-sm bg-accent"
                style={{ height: `${(n / maxBar) * 100}%`, minHeight: n ? 3 : 1, opacity: n ? 1 : 0.15 }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>0,5</span>
          <span>5</span>
        </div>
      </div>

      <SectionTitle>{t.profile.library}</SectionTitle>
      <div className="mb-4 flex gap-2" role="tablist">
        {TABS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={tab === s}
            onClick={() => setTab(s)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${tab === s ? "border-accent font-bold text-accent" : "border-line"}`}
          >
            {t.status[s]}
          </button>
        ))}
      </div>
      {shelf.length === 0 ? (
        <Muted>—</Muted>
      ) : (
        <PosterGrid>
          {shelf.map((a) => (
            <AnimeTile key={a.id} anime={a} />
          ))}
        </PosterGrid>
      )}
    </>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className={`${card} p-4`}>
      <div className="font-display text-3xl leading-none">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}
