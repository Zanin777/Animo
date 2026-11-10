"use client";

import { useParams } from "next/navigation";
import { CommunityReviews } from "@/components/CommunityReviews";
import { SeasonsSection } from "@/components/SeasonsSection";
import { Synopsis } from "@/components/Synopsis";
import { IconHeart, IconImage } from "@/components/Icons";
import { CoverPicker } from "@/components/CoverPicker";
import { useAuth } from "@/lib/auth";
import { openLog } from "@/components/LogDrawer";
import { useState } from "react";
import { EntryRow } from "@/components/EntryRow";
import { EpisodeList } from "@/components/EpisodeList";
import Image from "next/image";
import { SharedPoster, coverUrl } from "@/components/Poster";
import { Tilt } from "@/components/Tilt";
import { Muted, SectionTitle, btnGhost, btnPrimary, input, rows } from "@/components/ui";
import { useCatalog } from "@/lib/catalog/local";
import { diary, useDiary } from "@/lib/diary/store";
import { isPremium, type WatchStatus } from "@/lib/diary/types";
import { t } from "@/messages";

const STATUSES: WatchStatus[] = ["want", "watching", "watched"];

export function AnimeView() {
  const { id } = useParams<{ id: string }>();
  const state = useDiary();
  const catalog = useCatalog();
  // a página é da série: o topo mostra a 1ª temporada; a URL pode apontar para qualquer temporada,
  // que já vem escolhida no seletor
  const anime = catalog.get(catalog.series.headOf(id)) ?? catalog.get(id);
  const seasons = catalog.series.seasonsOf(id);
  const [notice, setNotice] = useState<string | null>(null);
  const [listId, setListId] = useState("");
  const [picked, setPicked] = useState<{ forId: string; season: string } | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const auth = useAuth();
  // trocar capa: só para quem está logado e é Premium
  const canPickCover = auth.status === "user" && isPremium(state.profile.role);

  if (!anime) return catalog.ready ? <Muted>{t.anime.notFound}</Muted> : null;

  const selectedId = picked?.forId === id ? picked.season : id;
  // o que vale para status, reviews e episódios: a temporada escolhida (ou o próprio anime)
  const season = (seasons.length > 0 && catalog.get(selectedId)) || anime;
  const seasonIds = seasons.length > 0 ? new Set(seasons.map((s) => s.anime.id)) : new Set([anime.id]);
  const selectedTab = seasons.find((s) => s.anime.id === season.id);

  const lib = state.library[season.id];
  const isFav = state.favorites.includes(anime.id);
  const entries = state.entries
    .filter((e) => seasonIds.has(e.animeId))
    .sort((a, b) => b.watchedOn.localeCompare(a.watchedOn));

  const totalEps = seasons.reduce((n, s) => n + (s.anime.episodes ?? 0), 0);
  const meta = (
    seasons.length > 0
      ? [anime.year, t.kind[anime.kind], t.seasons.count(seasons.length), totalEps ? t.anime.episodes(totalEps) : null]
      : [anime.year, t.kind[anime.kind], anime.episodes && anime.kind !== "movie" ? t.anime.episodes(anime.episodes) : null]
  )
    .filter(Boolean)
    .join(" · ");

  const backdrop = coverUrl(anime);

  return (
    <>
      {/* topo: a própria capa, desfocada, vira o fundo · celular: sinopse embaixo, na largura toda;
          sm+: ao lado do pôster, sob os botões */}
      <header className="relative isolate -mx-4 -mt-6 px-4 pt-8 pb-2 sm:pt-10">
        {backdrop && (
          <div
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)]"
            aria-hidden="true"
          >
            <Image src={backdrop} alt="" fill sizes="480px" className="scale-125 object-cover opacity-45 blur-3xl saturate-150" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/75 to-bg" />
          </div>
        )}
      <div className="grid grid-cols-[120px_1fr] gap-x-5 gap-y-4 sm:grid-cols-[200px_1fr] sm:gap-x-8 sm:grid-rows-[auto_1fr]">
        <Tilt className="self-start shadow-[0_24px_48px_-16px_rgb(0_0_0/0.55)] sm:row-span-2">
          <SharedPoster anime={anime} />
        </Tilt>
        <div className="min-w-0 sm:pt-2">
          <h1 className="font-display text-2xl leading-tight text-balance break-words sm:text-4xl">{anime.title}</h1>
          {anime.titleOriginal && <p className="mt-1 text-muted">{anime.titleOriginal}</p>}
          <p className="mt-2 text-sm text-muted">{meta}</p>
          {anime.genres.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t.anime.genres}>
              {anime.genres.map((g) => (
                <li key={g} className="rounded-full border border-line bg-bg/40 px-2.5 py-0.5 text-xs">
                  {t.genre[g] ?? g}
                </li>
              ))}
            </ul>
          )}
          {!anime.isVerified && <p className="mt-1 text-xs text-muted">{t.search.userCreated}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={() => openLog(season.id)}>
              {selectedTab ? t.anime.logSeason(t.seasons.short(selectedTab.season, selectedTab.part)) : t.anime.logCta}
            </button>
            <button
              type="button"
              className={`${btnGhost} ${isFav ? "text-accent" : ""}`}
              aria-pressed={isFav}
              onClick={() => {
                const ok = diary.toggleFavorite(anime.id);
                setNotice(ok ? null : t.anime.favoritesFull);
              }}
            >
              <IconHeart size={17} filled={isFav} />
              {isFav ? t.anime.unfavorite : t.anime.favorite}
            </button>
            {canPickCover && (
              <button type="button" className={btnGhost} aria-expanded={coverOpen} onClick={() => setCoverOpen((v) => !v)}>
                <IconImage size={17} />
                {t.covers.cta}
              </button>
            )}
          </div>
        </div>
        <Synopsis key={`s-${anime.id}`} anime={anime} className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2" />
      </div>
      </header>

      {notice && <p className="mt-3 text-sm text-accent">{notice}</p>}

      {canPickCover && coverOpen && auth.status === "user" && (
        <CoverPicker
          key={`c-${season.id}`}
          anime={season}
          userId={auth.userId}
          label={selectedTab ? t.seasons.short(selectedTab.season, selectedTab.part) : season.title}
        />
      )}

      {seasons.length > 0 && (
        <SeasonsSection seasons={seasons} selectedId={season.id} onSelect={(s) => setPicked({ forId: id, season: s })} />
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-md bg-card p-1" role="group" aria-label={selectedTab ? t.seasons.long(selectedTab.season, selectedTab.part) : "Status"}>
        {STATUSES.map((s) => {
          const on = lib?.status === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => diary.setStatus(season.id, on ? null : s)}
              className={`press cursor-pointer rounded-[5px] px-3 py-1.5 text-sm transition-colors ${
                on ? "bg-bg font-bold text-fg shadow-[0_1px_2px_rgb(0_0_0/0.18)]" : "text-muted hover:text-fg"
              }`}
            >
              {t.status[s]}
            </button>
          );
        })}
      </div>
        {lib?.status === "watching" && (
          <>
            <span className="text-sm text-muted">{t.home.episodeOf(lib.episodesWatched, season.episodes)}</span>
            <button
              type="button"
              onClick={() => diary.plusOneEpisode(season)}
              className="press cursor-pointer rounded-md bg-card px-2.5 py-1.5 text-xs font-bold text-fg hover:text-detail"
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
        <div className={rows}>
          {entries.map((e) => (
            <div key={e.id} className="group relative">
              <EntryRow entry={e} anime={catalog.get(e.animeId) ?? anime} showTitle={seasons.length > 0} />
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

      <CommunityReviews key={`r-${season.id}`} animeId={season.id} />

      <EpisodeList key={`e-${season.id}`} anime={season} />
    </>
  );
}
