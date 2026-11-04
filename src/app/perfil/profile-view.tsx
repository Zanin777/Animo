"use client";

import Link from "next/link";
import { useState } from "react";
import { Hanko } from "@/components/Hanko";
import { Poster } from "@/components/Poster";
import { SlidingNumber } from "@/components/SlidingNumber";
import { AnimeTile, Muted, PosterGrid, SectionTitle, card } from "@/components/ui";
import type { Anime } from "@/lib/catalog/provider";
import { useCatalog } from "@/lib/catalog/local";
import { computeStats } from "@/lib/diary/stats";
import { useDiary } from "@/lib/diary/store";
import { MAX_FAVORITES, type Entry, type WatchStatus } from "@/lib/diary/types";
import { formatRating } from "@/lib/rating";
import { useCurrentYear } from "@/lib/use-current-year";
import { t } from "@/messages";
import { ProfileHeader } from "./profile-header";

const TABS: WatchStatus[] = ["watched", "watching", "want"];

const byNewest = (a: Entry, b: Entry) => b.watchedOn.localeCompare(a.watchedOn) || b.createdAt.localeCompare(a.createdAt);

export function ProfileView() {
  const state = useDiary();
  const catalog = useCatalog();
  const stats = computeStats(state, useCurrentYear());
  const [tab, setTab] = useState<WatchStatus>("watched");

  const favorites = state.favorites.map((id) => catalog.get(id)).filter((a): a is Anime => a !== null);
  const entries = [...state.entries].sort(byNewest);
  const recent = entries.slice(0, 8);
  const animeCount = Object.keys(state.library).length;
  const episodeCount = Object.values(state.episodeRatings).reduce((n, eps) => n + Object.keys(eps).length, 0);

  // melhores episódios: nota mais alta primeiro
  const bestEpisodes = Object.entries(state.episodeRatings)
    .flatMap(([animeId, eps]) => Object.entries(eps).map(([ep, half]) => ({ animeId, ep: Number(ep), half })))
    .sort((a, b) => b.half - a.half || a.animeId.localeCompare(b.animeId) || a.ep - b.ep)
    .slice(0, 6);

  // diário por mês (YYYY-MM)
  const months = new Map<string, Entry[]>();
  for (const e of entries.slice(0, 60)) {
    const k = e.watchedOn.slice(0, 7);
    if (!months.has(k)) months.set(k, []);
    months.get(k)!.push(e);
  }

  const shelf = Object.values(state.library)
    .filter((l) => l.status === tab)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((l) => catalog.get(l.animeId))
    .filter((a): a is Anime => a !== null);

  const maxBar = Math.max(1, ...stats.distribution);
  const backdrop = favorites.length ? favorites : recent.map((e) => catalog.get(e.animeId)).filter((a): a is Anime => a !== null);

  return (
    <>
      <ProfileHeader
        profile={state.profile}
        backdrop={backdrop}
        stats={[
          { value: animeCount, label: t.profile.statAnimes },
          { value: stats.thisYear, label: t.profile.statThisYear },
          { value: episodeCount, label: t.profile.statEpisodes },
          { value: state.lists.length, label: t.profile.statLists },
        ]}
      />

      {/* favoritos: 4 grandes, numerados com selo */}
      <SectionTitle>{t.profile.favorites}</SectionTitle>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: MAX_FAVORITES }, (_, i) => {
          const a = favorites[i];
          return (
            <div key={a?.id ?? `vazio-${i}`} className="relative">
              <span className="absolute -top-2 -left-2 z-10 grid h-7 w-7 -rotate-6 place-items-center rounded-full border-2 border-accent bg-bg font-display text-xs text-accent">
                {i + 1}
              </span>
              {a ? <AnimeTile anime={a} /> : <div className="aspect-[2/3] rounded-lg border border-dashed border-line" />}
            </div>
          );
        })}
      </div>
      {favorites.length === 0 && <Muted className="mt-2">{t.profile.favoritesEmpty}</Muted>}

      {/* atividade recente: capa + nota embaixo */}
      <SectionTitle>{t.profile.recent}</SectionTitle>
      {recent.length === 0 ? (
        <Muted>{t.profile.recentEmpty}</Muted>
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pt-3 pb-2">
          {recent.map((e) => {
            const a = catalog.get(e.animeId);
            if (!a) return null;
            return (
              <div key={e.id} className="w-24 flex-none sm:w-28">
                <Link href={`/anime/${a.id}`} className="poster-link" aria-label={a.title}>
                  <Poster anime={a} />
                </Link>
                <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
                  <span>{e.ratingHalf !== null ? <span className="text-accent">{"★".repeat(Math.floor(e.ratingHalf / 2))}{e.ratingHalf % 2 ? "½" : ""}</span> : "—"}</span>
                  {e.isRewatch && <span>{t.profile.rewatch}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* melhores episódios */}
      <SectionTitle>{t.profile.bestEpisodes}</SectionTitle>
      {bestEpisodes.length === 0 ? (
        <Muted>{t.profile.bestEpisodesEmpty}</Muted>
      ) : (
        <ol className={`${card} grid gap-0.5 p-2`}>
          {bestEpisodes.map((b, i) => {
            const a = catalog.get(b.animeId);
            if (!a) return null;
            return (
              <li key={`${b.animeId}#${b.ep}`}>
                <Link href={`/anime/${a.id}#ep-${b.ep}`} className="grid grid-cols-[24px_36px_1fr_auto] items-center gap-3 rounded-lg p-1.5 hover:bg-bg">
                  <span className="text-center font-display text-muted">{i + 1}</span>
                  <Poster anime={a} size="xs" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{t.community.episodeOf(b.ep, a.title)}</span>
                  </span>
                  <Hanko half={b.half} size="sm" />
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {/* notas */}
      <SectionTitle>{t.profile.ratingsTitle}</SectionTitle>
      <div className={`${card} grid gap-4 p-4 sm:grid-cols-[auto_1fr] sm:items-center`}>
        <div className="flex items-center gap-3">
          {stats.avgHalf !== null ? (
            <span className="hanko hanko-lg">
              <SlidingNumber value={stats.avgHalf / 2} decimals={1} />
            </span>
          ) : (
            <span className="hanko hanko-lg opacity-40">–</span>
          )}
          <div className="text-sm text-muted">
            <div>{t.profile.statAvg}</div>
            <div>{t.community.ratings(stats.distribution.reduce((s, n) => s + n, 0))}</div>
          </div>
        </div>
        <div>
          <div className="flex h-20 items-end gap-1" aria-label={t.profile.distribution}>
            {stats.distribution.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col justify-end" title={`${formatRating(i + 1)}: ${n}`}>
                <div className="w-full rounded-sm bg-accent" style={{ height: `${(n / maxBar) * 100}%`, minHeight: n ? 3 : 1, opacity: n ? 1 : 0.15 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>½</span>
            <span>★★★★★</span>
          </div>
        </div>
      </div>

      {/* diário por mês */}
      {months.size > 0 && (
        <>
          <SectionTitle>{t.profile.diaryByMonth}</SectionTitle>
          <div className="grid gap-5">
            {[...months].map(([ym, list]) => {
              const [y, m] = ym.split("-").map(Number);
              return (
                <div key={ym}>
                  <h3 className="mb-2 text-sm font-bold text-muted">
                    {t.monthsLong[m - 1]} {y}
                  </h3>
                  <ul className={`${card} divide-y divide-line`}>
                    {list.map((e) => {
                      const a = catalog.get(e.animeId);
                      if (!a) return null;
                      return (
                        <li key={e.id}>
                          <Link href={`/anime/${a.id}`} className="grid grid-cols-[32px_28px_1fr_auto] items-center gap-3 px-3 py-2 hover:bg-bg">
                            <span className="text-center font-display text-lg text-muted">{Number(e.watchedOn.slice(8, 10))}</span>
                            <Poster anime={a} size="xs" />
                            <span className="min-w-0 truncate text-sm">
                              {a.title}
                              {e.isRewatch && <span className="ml-1.5 text-xs text-muted">↻</span>}
                            </span>
                            {e.ratingHalf !== null ? <Hanko half={e.ratingHalf} size="sm" /> : <span />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* biblioteca */}
      <SectionTitle>{t.profile.library}</SectionTitle>
      <div className="mb-4 flex gap-2" role="tablist" aria-label={t.profile.library}>
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

      {/* listas */}
      {state.lists.length > 0 && (
        <>
          <SectionTitle>{t.profile.myLists}</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {state.lists.slice(0, 4).map((l) => (
              <Link key={l.id} href={`/listas/${l.id}`} className={`${card} flex items-center gap-3 p-3 hover:border-fg`}>
                <div className="flex w-20 flex-none -space-x-6">
                  {l.items.slice(0, 3).map((i) => {
                    const a = catalog.get(i.animeId);
                    return a ? <Poster key={i.animeId} anime={a} size="xs" className="w-10 ring-2 ring-card" /> : null;
                  })}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold">{l.title}</p>
                  <p className="text-xs text-muted">{t.lists.items(l.items.length)}</p>
                </div>
              </Link>
            ))}
          </div>
          {state.lists.length > 4 && (
            <Link href="/listas" className="mt-2 inline-block text-sm text-accent">
              {t.profile.seeAll} →
            </Link>
          )}
        </>
      )}

      <Muted className="mt-10 text-xs">{t.profile.localNotice}</Muted>
    </>
  );
}
