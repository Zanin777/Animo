"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Anime } from "@/lib/catalog/provider";
import { diary, useDiary } from "@/lib/diary/store";
import { STILL_PATH, numberedEpisodes, type Episode, type EpisodesResponse } from "@/lib/episodes/types";
import { posterStyle } from "@/lib/poster";
import { formatRating } from "@/lib/rating";
import { formatDate, t } from "@/messages";
import { Muted, SectionTitle, btnGhost } from "./ui";
import { StarRating } from "./StarRating";

const PAGE = 30;
const cache = new Map<string, EpisodesResponse>();

// animes criados pelo usuário não estão no servidor: só numeração
const isLocal = (a: Anime) => a.id.startsWith("u-");

function useEpisodes(anime: Anime): { episodes: Episode[] | null } {
  const [data, setData] = useState<EpisodesResponse | null>(() => cache.get(anime.id) ?? null);
  useEffect(() => {
    if (isLocal(anime) || cache.has(anime.id)) return;
    let alive = true;
    fetch(`/api/episodes/${encodeURIComponent(anime.id)}`)
      .then((r) => (r.ok ? (r.json() as Promise<EpisodesResponse>) : null))
      .then((d) => {
        if (!d || !alive) return;
        cache.set(anime.id, d);
        setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [anime]);
  if (isLocal(anime)) return { episodes: numberedEpisodes(anime.episodes ?? 0) };
  return { episodes: data?.episodes ?? null };
}

/** Todos os episódios do anime, com imagem e nota de cada um (não é para assistir). */
export function EpisodeList({ anime }: { anime: Anime }) {
  const state = useDiary();
  const { episodes } = useEpisodes(anime);
  const [shown, setShown] = useState(PAGE);
  if (anime.kind === "movie") return null;

  const ratings = state.episodeRatings[anime.id] ?? {};
  const watchedUpTo = state.library[anime.id]?.status === "watched" ? Infinity : (state.library[anime.id]?.episodesWatched ?? 0);
  const rated = Object.entries(ratings);
  const avg = rated.length ? rated.reduce((s, [, v]) => s + v, 0) / rated.length : null;
  const best = rated.length ? Number(rated.sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))[0][0]) : null;

  return (
    <section>
      <SectionTitle>
        {t.episodes.title}
        {episodes && <span className="ml-2 font-sans text-sm font-normal text-muted">{episodes.length}</span>}
      </SectionTitle>
      {avg !== null && (
        <p className="-mt-2 mb-3 text-sm text-muted">{t.episodes.yourAvg(formatRating(Math.round(avg)), rated.length)}</p>
      )}

      {episodes === null ? (
        <Muted>{t.episodes.loading}</Muted>
      ) : episodes.length === 0 ? (
        <Muted>{t.episodes.none}</Muted>
      ) : (
        <>
          <ol className="grid gap-2">
            {episodes.slice(0, shown).map((ep) => (
              <EpisodeRow
                key={ep.number}
                anime={anime}
                ep={ep}
                rating={ratings[ep.number] ?? null}
                watched={ep.number <= watchedUpTo}
                isBest={ep.number === best}
              />
            ))}
          </ol>
          {episodes.length > shown && (
            <button type="button" className={`${btnGhost} mt-3`} onClick={() => setShown((n) => n + PAGE)}>
              {t.episodes.showMore(Math.min(PAGE, episodes.length - shown))}
            </button>
          )}
        </>
      )}
    </section>
  );
}

function EpisodeRow({ anime, ep, rating, watched, isBest }: { anime: Anime; ep: Episode; rating: number | null; watched: boolean; isBest: boolean }) {
  const { palette } = posterStyle(anime.title);
  const [failed, setFailed] = useState(false);
  const still = !failed && ep.still && STILL_PATH.test(ep.still) ? ep.still : null;
  return (
    <li id={`ep-${ep.number}`} className={`scroll-mt-20 grid grid-cols-[112px_1fr] gap-3 rounded-xl border bg-card p-2 sm:grid-cols-[160px_1fr_auto] sm:items-center ${isBest ? "border-accent" : "border-line"}`}>
      <div className="relative aspect-video overflow-hidden rounded-lg" style={{ background: palette.bg, color: palette.fg }}>
        {still ? (
          <Image
            src={`https://image.tmdb.org/t/p/w300${still}`}
            alt=""
            fill
            sizes="(min-width: 640px) 160px, 112px"
            className="object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-display text-2xl opacity-80">{ep.number}</span>
        )}
      </div>
      <div className="min-w-0 self-center">
        <p className="text-xs text-muted">
          <span className="font-bold text-fg">{t.episodes.ep(ep.number)}</span>
          {ep.airDate && ` · ${formatDate(ep.airDate)}`}
          {ep.runtime && ` · ${t.episodes.min(ep.runtime)}`}
          {watched && <span className="ml-1.5 rounded-full border border-line px-1.5 text-[10px]">{t.episodes.watched}</span>}
          {isBest && <span className="ml-1.5 rounded-full border border-accent px-1.5 text-[10px] text-accent">{t.episodes.best}</span>}
        </p>
        {ep.name && <p className="line-clamp-2 text-sm font-bold leading-snug">{ep.name}</p>}
        <div className="mt-1 sm:hidden">
          <StarRating size="sm" value={rating} onChange={(v) => diary.rateEpisode(anime.id, ep.number, v)} label={t.episodes.rateLabel(ep.number)} />
        </div>
      </div>
      <div className="hidden items-center gap-2 pr-2 sm:flex">
        <StarRating size="sm" value={rating} onChange={(v) => diary.rateEpisode(anime.id, ep.number, v)} label={t.episodes.rateLabel(ep.number)} />
        <span className="w-7 text-right font-display text-sm text-accent">{rating ? formatRating(rating) : ""}</span>
      </div>
    </li>
  );
}
