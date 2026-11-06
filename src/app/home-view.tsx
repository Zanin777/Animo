"use client";

import Link from "next/link";
import { EntryRow } from "@/components/EntryRow";
import { openLog } from "@/components/LogDrawer";
import { Poster } from "@/components/Poster";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Muted, PageTitle, SectionTitle, btnPrimary, card, rows } from "@/components/ui";
import { useCatalog } from "@/lib/catalog/local";
import { useCommunity } from "@/lib/community";
import { diary, useDiary } from "@/lib/diary/store";
import { t } from "@/messages";
import { useCurrentYear } from "@/lib/use-current-year";
import {
  ActivitySection,
  CatalogHighlights,
  CoverMarquee,
  FeaturedListsSection,
  RankingsSection,
  RecentReleases,
  TrendingSection,
  marqueeItems,
} from "./home-sections";

export function HomeView() {
  const state = useDiary();
  const catalog = useCatalog();
  const snap = useCommunity();
  const year = useCurrentYear();
  const hasCommunity = snap.events.length > 0;

  const watching = Object.values(state.library)
    .filter((l) => l.status === "watching")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((l) => ({ item: l, anime: catalog.get(l.animeId) }))
    .filter((x) => x.anime !== null);

  const entries = [...state.entries]
    .sort((a, b) => b.watchedOn.localeCompare(a.watchedOn) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  return (
    <>
      <PageTitle
        aside={
          <span className="md:hidden">
            <ThemeSwitch />
          </span>
        }
      >
        <span className="md:hidden">
          aniora<span className="text-accent">.</span>
        </span>
        <span className="hidden md:inline">{t.home.title}</span>
      </PageTitle>

      {catalog.ready && <CoverMarquee items={marqueeItems(snap, catalog)} />}

      {watching.length > 0 && (
        <>
          <SectionTitle>{t.home.watchingTitle}</SectionTitle>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pt-3 pb-2">
            {watching.map(({ item, anime }) => (
              <div key={item.animeId} className="w-32 flex-none snap-start">
                <Link href={`/anime/${anime!.id}`} aria-label={anime!.title} className="poster-link">
                  <Poster anime={anime!} />
                </Link>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <span className="text-xs text-muted">{t.home.episodeOf(item.episodesWatched, anime!.episodes)}</span>
                  <button
                    type="button"
                    onClick={() => diary.plusOneEpisode(anime!)}
                    className="press cursor-pointer rounded-md bg-card px-2 py-0.5 text-xs font-bold text-fg hover:text-accent"
                  >
                    {t.home.plusOne}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {snap.ready && hasCommunity && (
        <>
          <TrendingSection snap={snap} catalog={catalog} />
          <RankingsSection snap={snap} catalog={catalog} />
          <ActivitySection snap={snap} catalog={catalog} />
          <FeaturedListsSection snap={snap} catalog={catalog} />
        </>
      )}
      {snap.ready && !hasCommunity && (
        <>
          {/* comunidade ainda vazia: catálogo de verdade, sem números inventados */}
          <CatalogHighlights catalog={catalog} />
          <RecentReleases catalog={catalog} year={year} />
          <SectionTitle>{t.community.rankingsTitle}</SectionTitle>
          <Muted>{t.home.rankingsSoon}</Muted>
        </>
      )}

      <SectionTitle>{t.home.diaryTitle}</SectionTitle>
      {entries.length === 0 ? (
        <div className={`${card} p-6 text-center`}>
          <Muted className="mx-auto max-w-sm">{t.home.empty}</Muted>
          <button type="button" onClick={() => openLog()} className={`${btnPrimary} mt-4`}>
            {t.home.emptyCta}
          </button>
        </div>
      ) : (
        <div className={rows}>
          {entries.map((e) => {
            const anime = catalog.get(e.animeId);
            return anime ? <EntryRow key={e.id} entry={e} anime={anime} /> : null;
          })}
        </div>
      )}
    </>
  );
}
