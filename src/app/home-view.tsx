"use client";

import Link from "next/link";
import { EntryRow } from "@/components/EntryRow";
import { Poster } from "@/components/Poster";
import { Muted, PageTitle, SectionTitle, btnPrimary, card } from "@/components/ui";
import { useCatalog } from "@/lib/catalog/local";
import { diary, useDiary } from "@/lib/diary/store";
import { t } from "@/messages";

export function HomeView() {
  const state = useDiary();
  const catalog = useCatalog();

  const watching = Object.values(state.library)
    .filter((l) => l.status === "watching")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((l) => ({ item: l, anime: catalog.get(l.animeId) }))
    .filter((x) => x.anime !== null);

  const entries = [...state.entries]
    .sort((a, b) => b.watchedOn.localeCompare(a.watchedOn) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);

  return (
    <>
      <PageTitle>
        <span className="md:hidden">
          cour<span className="text-accent">.</span>
        </span>
        <span className="hidden md:inline">{t.home.title}</span>
      </PageTitle>

      {watching.length > 0 && (
        <>
          <SectionTitle>{t.home.watchingTitle}</SectionTitle>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {watching.map(({ item, anime }) => (
              <div key={item.animeId} className="w-32 flex-none snap-start">
                <Link href={`/anime/${anime!.id}`}>
                  <Poster anime={anime!} />
                </Link>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <span className="text-xs text-muted">{t.home.episodeOf(item.episodesWatched, anime!.episodes)}</span>
                  <button
                    type="button"
                    onClick={() => diary.plusOneEpisode(anime!)}
                    className="cursor-pointer rounded-full border border-accent px-2 py-0.5 text-xs font-bold text-accent"
                  >
                    {t.home.plusOne}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>{t.home.diaryTitle}</SectionTitle>
      {entries.length === 0 ? (
        <div className={`${card} p-6 text-center`}>
          <Muted className="mx-auto max-w-sm">{t.home.empty}</Muted>
          <Link href="/registrar" className={`${btnPrimary} mt-4`}>
            {t.home.emptyCta}
          </Link>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {entries.map((e) => {
            const anime = catalog.get(e.animeId);
            return anime ? <EntryRow key={e.id} entry={e} anime={anime} /> : null;
          })}
        </div>
      )}
    </>
  );
}
