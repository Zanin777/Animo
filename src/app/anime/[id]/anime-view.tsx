"use client";

import { useParams } from "next/navigation";
import { EpisodeList } from "@/components/EpisodeList";
import { openLog } from "@/components/LogDrawer";
import { useState } from "react";
import { EntryRow } from "@/components/EntryRow";
import { Poster } from "@/components/Poster";
import { Muted, SectionTitle, btnGhost, btnPrimary, input } from "@/components/ui";
import { useCatalog } from "@/lib/catalog/local";
import { diary, useDiary } from "@/lib/diary/store";
import type { WatchStatus } from "@/lib/diary/types";
import { t } from "@/messages";

const STATUSES: WatchStatus[] = ["want", "watching", "watched"];

export function AnimeView() {
  const { id } = useParams<{ id: string }>();
  const state = useDiary();
  const catalog = useCatalog();
  const anime = catalog.get(id);
  const [notice, setNotice] = useState<string | null>(null);
  const [listId, setListId] = useState("");

  if (!anime) return catalog.ready ? <Muted>{t.anime.notFound}</Muted> : null;

  const lib = state.library[anime.id];
  const isFav = state.favorites.includes(anime.id);
  const entries = state.entries
    .filter((e) => e.animeId === anime.id)
    .sort((a, b) => b.watchedOn.localeCompare(a.watchedOn));

  const meta = [anime.year, t.kind[anime.kind], anime.episodes && anime.kind !== "movie" ? t.anime.episodes(anime.episodes) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="grid grid-cols-[120px_1fr] gap-5 sm:grid-cols-[180px_1fr]">
        <Poster anime={anime} />
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight break-words sm:text-3xl">{anime.title}</h1>
          {anime.titleOriginal && <p className="mt-1 text-muted">{anime.titleOriginal}</p>}
          <p className="mt-2 text-sm text-muted">{meta}</p>
          {!anime.isVerified && <p className="mt-1 text-xs text-muted">{t.search.userCreated}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={() => openLog(anime.id)}>
              {t.anime.logCta}
            </button>
            <button
              type="button"
              className={`${btnGhost} ${isFav ? "border-accent text-accent" : ""}`}
              onClick={() => {
                const ok = diary.toggleFavorite(anime.id);
                setNotice(ok ? null : t.anime.favoritesFull);
              }}
            >
              {isFav ? `♥ ${t.anime.unfavorite}` : `♡ ${t.anime.favorite}`}
            </button>
          </div>
        </div>
      </div>

      {notice && <p className="mt-3 text-sm text-accent">{notice}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Status">
        {STATUSES.map((s) => {
          const on = lib?.status === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => diary.setStatus(anime.id, on ? null : s)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${on ? "border-accent font-bold text-accent" : "border-line"}`}
            >
              {t.status[s]}
            </button>
          );
        })}
        {lib?.status === "watching" && (
          <>
            <span className="ml-2 text-sm text-muted">{t.home.episodeOf(lib.episodesWatched, anime.episodes)}</span>
            <button
              type="button"
              onClick={() => diary.plusOneEpisode(anime)}
              className="cursor-pointer rounded-full border border-accent px-2.5 py-1 text-xs font-bold text-accent"
            >
              {t.home.plusOne}
            </button>
          </>
        )}
      </div>

      {state.lists.length > 0 && (
        <form
          className="mt-4 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!listId) return;
            setNotice(diary.addToList(listId, anime.id) ? t.lists.added : t.lists.already);
          }}
        >
          <select className={`${input} w-auto text-sm`} value={listId} onChange={(e) => setListId(e.target.value)} aria-label={t.lists.pick}>
            <option value="">{t.anime.addToList}</option>
            {state.lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
          <button type="submit" className={btnGhost} disabled={!listId}>
            +
          </button>
        </form>
      )}

      <SectionTitle>{t.anime.yourEntries}</SectionTitle>
      {entries.length === 0 ? (
        <Muted>{t.anime.noEntries}</Muted>
      ) : (
        <div className="grid gap-2.5">
          {entries.map((e) => (
            <div key={e.id} className="group relative">
              <EntryRow entry={e} anime={anime} showTitle={false} />
              <button
                type="button"
                className="absolute top-1 right-1 cursor-pointer rounded-full px-2 text-xs text-muted opacity-60 hover:text-accent hover:opacity-100"
                aria-label={t.entry.delete}
                title={t.entry.delete}
                onClick={() => confirm(t.entry.confirmDelete) && diary.deleteEntry(e.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <EpisodeList key={anime.id} anime={anime} />
    </>
  );
}
