"use client";

import Link from "next/link";
import { useState } from "react";
import { Tabs } from "@/components/community";
import { Hanko } from "@/components/Hanko";
import { Poster } from "@/components/Poster";
import { SlidingNumber } from "@/components/SlidingNumber";
import { AnimePicker } from "@/components/AnimePicker";
import { IconPlus } from "@/components/Icons";
import { AnimeTile, Muted, PosterGrid, SectionTitle, card, rows } from "@/components/ui";
import type { Anime } from "@/lib/catalog/provider";
import { useCatalog } from "@/lib/catalog/local";
import { computeStats } from "@/lib/diary/stats";
import { diary, useDiary } from "@/lib/diary/store";
import { MAX_FAVORITES, type DiaryState, type Entry, type WatchStatus } from "@/lib/diary/types";
import { accentStyle } from "@/lib/profile/accents";
import { formatRating } from "@/lib/rating";
import { useAuth } from "@/lib/auth";
import { useFollows } from "@/lib/social/follows";
import { useCurrentYear } from "@/lib/use-current-year";
import { t } from "@/messages";
import { ProfileHeader } from "./profile-header";

const TABS: WatchStatus[] = ["watched", "watching", "want"];
type Section = "overview" | "diary" | "library" | "lists";
const SECTIONS: Section[] = ["overview", "diary", "library", "lists"];
const SECTION_LABEL: Record<Section, string> = {
  overview: t.profile.tabOverview,
  diary: t.profile.tabDiary,
  library: t.profile.tabLibrary,
  lists: t.profile.tabLists,
};

const byNewest = (a: Entry, b: Entry) => b.watchedOn.localeCompare(a.watchedOn) || b.createdAt.localeCompare(a.createdAt);

export function ProfileView() {
  const auth = useAuth();
  const userId = auth.status === "user" ? auth.userId : null;
  return <ProfileBody key={userId ?? "local"} state={useDiary()} userId={userId} />;
}

/**
 * Corpo do perfil. readOnly = perfil público de alguém (sem editar, sem favoritar).
 * userId = dono do perfil no banco (null = perfil só deste navegador: sem seguidores).
 */
export function ProfileBody({ state, userId = null, readOnly = false }: { state: DiaryState; userId?: string | null; readOnly?: boolean }) {
  const catalog = useCatalog();
  const [picking, setPicking] = useState(false);
  const stats = computeStats(state, useCurrentYear());
  const [tab, setTab] = useState<WatchStatus>("watched");
  const [section, setSection] = useState<Section>("overview");
  const follows = useFollows(userId);

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
  for (const e of entries) {
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
  const counts: Record<Section, number | null> = {
    overview: null,
    diary: entries.length,
    library: Object.keys(state.library).length,
    lists: state.lists.length,
  };

  // coluna ao lado do topo: gêneros mais vistos (vistos + assistindo) e o que está assistindo
  const seen = Object.values(state.library).filter((l) => l.status !== "want");
  const genreCount = new Map<string, number>();
  for (const l of seen) for (const g of catalog.get(l.animeId)?.genres ?? []) genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
  const side = {
    genres: [...genreCount].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5).map(([g]) => g),
    watching: seen
      .filter((l) => l.status === "watching")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3)
      .map((l) => catalog.get(l.animeId))
      .filter((a): a is Anime => a !== null),
  };
  const backdrop = favorites.length ? favorites : recent.map((e) => catalog.get(e.animeId)).filter((a): a is Anime => a !== null);

  return (
    <div style={accentStyle(state.profile.accent)}>
      <ProfileHeader
        readOnly={readOnly}
        side={side}
        profile={state.profile}
        backdrop={backdrop}
        follows={follows}
        stats={[
          { value: animeCount, label: t.profile.statAnimes },
          { value: stats.thisYear, label: t.profile.statThisYear },
          // com conta: seguidores e seguindo; perfil só do navegador: episódios e listas
          ...(follows.followers !== null && follows.following !== null
            ? [
                { value: follows.followers, label: t.profile.statFollowers },
                { value: follows.following, label: t.profile.statFollowing },
              ]
            : [
                { value: episodeCount, label: t.profile.statEpisodes },
                { value: state.lists.length, label: t.profile.statLists },
              ]),
        ]}
      />

      <div className="mt-8">
        <Tabs label={t.profile.sections} value={section} onChange={setSection} tabs={SECTIONS.map((k) => [
            k,
            <>
              {SECTION_LABEL[k]}
              {counts[k] !== null && <span className="ml-1.5 text-xs font-normal text-muted tabular-nums">{counts[k]}</span>}
            </>,
          ])} />
      </div>

      {section === "overview" && (
        <>

          {/* favoritos: 4 grandes, numerados com selo; vazio = "+" para escolher */}
          <SectionTitle>{t.profile.favorites}</SectionTitle>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: MAX_FAVORITES }, (_, i) => {
              const a = favorites[i];
              return (
                <div key={a?.id ?? `vazio-${i}`} className="group relative">
                  <span className="absolute -top-2 -left-2 z-10 grid h-7 w-7 -rotate-6 place-items-center rounded-full border-2 border-accent bg-bg font-display text-xs text-accent">
                    {i + 1}
                  </span>
                  {a ? (
                    <>
                      <AnimeTile anime={a} />
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => diary.toggleFavorite(a.id)}
                          className="absolute -top-2 -right-2 z-10 grid h-7 w-7 cursor-pointer place-items-center rounded-full border border-line bg-bg text-sm text-muted transition-opacity hover:text-fg sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                          aria-label={`${t.profile.removeFavorite}: ${a.title}`}
                          title={t.profile.removeFavorite}
                        >
                          ×
                        </button>
                      )}
                    </>
                  ) : readOnly ? (
                    <div className="aspect-[2/3] rounded-lg border border-dashed border-line" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPicking(true)}
                      className="press grid aspect-[2/3] w-full cursor-pointer place-items-center rounded-lg border border-dashed border-line text-muted transition-colors hover:border-accent hover:text-accent"
                      aria-label={t.profile.addFavorite}
                      title={t.profile.addFavorite}
                    >
                      <IconPlus size={28} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {!readOnly && favorites.length === 0 && <Muted className="mt-2">{t.profile.favoritesEmpty}</Muted>}
          {!readOnly && (
            <AnimePicker
              open={picking}
              title={t.profile.pickFavorite}
              exclude={state.favorites}
              onClose={() => setPicking(false)}
              onPick={(a) => {
                diary.toggleFavorite(a.id);
                setPicking(false);
              }}
            />
          )}

          {/* atividade recente: capa + nota embaixo */}
          <SectionTitle>{t.profile.recent}</SectionTitle>
          {recent.length === 0 ? (
            <Muted>{t.profile.recentEmpty}</Muted>
          ) : (
            <div className="-mx-4 -mt-1 flex gap-3 overflow-x-auto px-4 pt-4 pb-2">
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
          {(!readOnly || bestEpisodes.length > 0) && <SectionTitle>{readOnly ? t.profile.bestEpisodesOther : t.profile.bestEpisodes}</SectionTitle>}
          {bestEpisodes.length === 0 ? (
            readOnly ? null : (
              <Muted>{t.profile.bestEpisodesEmpty}</Muted>
            )
          ) : (
            <ol className={rows}>
              {bestEpisodes.map((b, i) => {
                const a = catalog.get(b.animeId);
                if (!a) return null;
                return (
                  <li key={`${b.animeId}#${b.ep}`}>
                    <Link href={`/anime/${a.id}#ep-${b.ep}`} className="grid grid-cols-[24px_36px_1fr_auto] items-center gap-3 py-2.5 transition-colors hover:bg-card">
                      <span className="text-center font-display text-muted tabular-nums">{i + 1}</span>
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
          <SectionTitle>{readOnly ? t.profile.ratingsOther : t.profile.ratingsTitle}</SectionTitle>
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

        </>
      )}

      {/* diário por mês */}
      {section === "diary" &&
        (months.size === 0 ? (
          <Muted>{t.profile.diaryEmpty}</Muted>
        ) : (
          <div className="grid gap-5">
            {[...months].map(([ym, list]) => {
              const [y, m] = ym.split("-").map(Number);
              return (
                <div key={ym}>
                  <h3 className="mb-2 text-sm font-bold text-muted">
                    {t.monthsLong[m - 1]} {y}
                  </h3>
                  <ul className={rows}>
                    {list.map((e) => {
                      const a = catalog.get(e.animeId);
                      if (!a) return null;
                      return (
                        <li key={e.id}>
                          <Link href={`/anime/${a.id}`} className="grid grid-cols-[32px_28px_1fr_auto] items-center gap-3 py-2.5 transition-colors hover:bg-card">
                            <span className="text-center font-display text-lg text-muted tabular-nums">{Number(e.watchedOn.slice(8, 10))}</span>
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
        ))}

      {/* biblioteca */}
      {section === "library" && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.profile.library}>
            {TABS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={tab === s}
                onClick={() => setTab(s)}
                className={`press cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${
                  tab === s ? "border-active font-bold text-fg" : "border-line text-muted hover:text-fg"
                }`}
              >
                {t.status[s]}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {shelf.length === 0 ? (
              <Muted>—</Muted>
            ) : (
              <PosterGrid>
                {shelf.map((a) => (
                  <AnimeTile key={a.id} anime={a} />
                ))}
              </PosterGrid>
            )}
          </div>
        </>
      )}

      {/* listas */}
      {section === "lists" &&
        (state.lists.length === 0 ? (
          <Muted>{t.profile.listsEmpty}</Muted>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {state.lists.map((l) => (
              <Link key={l.id} href={`/listas/${l.id}`} className="flex items-center gap-3 rounded-md py-1 transition-colors hover:bg-card">
                <div className="flex w-20 flex-none -space-x-6">
                  {l.items.slice(0, 3).map((i) => {
                    const a = catalog.get(i.animeId);
                    return a ? <Poster key={i.animeId} anime={a} size="xs" className="w-10 ring-2 ring-bg" /> : null;
                  })}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold">{l.title}</p>
                  <p className="text-xs text-muted">{t.lists.items(l.items.length)}</p>
                </div>
              </Link>
            ))}
          </div>
        ))}

      {!readOnly && <Muted className="mt-10 text-xs">{t.profile.localNotice}</Muted>}
    </div>
  );
}
