"use client";

import Link from "next/link";
import { useState } from "react";
import { RankRow, Tabs, TrendingCard } from "@/components/community";
import { Hanko } from "@/components/Hanko";
import { Poster } from "@/components/Poster";
import { Rail } from "@/components/Rail";
import { Muted, SectionTitle, linkAction, rows as ruledRows } from "@/components/ui";
import type { Anime } from "@/lib/catalog/provider";
import type { LocalCatalog } from "@/lib/catalog/local";
import { FEATURED_IDS } from "@/lib/catalog/seed";
import {
  activity,
  mostWatched,
  mostWatchedEpisodes,
  topEpisodes,
  topRated,
  trending,
  trendingAmongFriends,
} from "@/lib/community/aggregate";
import type { CommunitySnapshot } from "@/lib/community/types";
import { t } from "@/messages";

type Props = { snap: CommunitySnapshot; catalog: LocalCatalog };

/** Capas passando no topo. Pausa ao passar o mouse. */
export function CoverMarquee({ items }: { items: Anime[] }) {
  if (items.length < 6) return null;
  return (
    <div className="marquee -mx-4 mb-2 overflow-hidden px-4 py-4" aria-label={t.community.trendingTitle}>
      <div className="marquee-track">
        {[...items, ...items].map((a, i) => (
          <Link key={`${a.id}-${i}`} href={`/anime/${a.id}`} className="poster-link w-24 flex-none sm:w-28" tabIndex={i >= items.length ? -1 : 0} aria-label={a.title} aria-hidden={i >= items.length}>
            <Poster anime={a} />
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Os mais em alta (comunidade); sem atividade, os destaques do catálogo. */
export function marqueeItems(snap: CommunitySnapshot, catalog: LocalCatalog): Anime[] {
  const fromCommunity = trending(snap.events, 14).map((s) => catalog.get(s.animeId));
  const list = fromCommunity.length >= 6 ? fromCommunity : FEATURED_IDS.map(catalog.get);
  return list.filter((a): a is Anime => a !== null);
}

/** Sem atividade da comunidade ainda: animes de verdade do catálogo, sem notas inventadas. */
export function CatalogHighlights({ catalog }: { catalog: LocalCatalog }) {
  const items = FEATURED_IDS.map(catalog.get).filter((a): a is Anime => a !== null);
  if (!items.length) return null;
  return (
    <section>
      <SectionTitle action={<Link href="/buscar" className={linkAction}>{t.community.seeCatalog}</Link>}>{t.home.highlightsTitle}</SectionTitle>
      <Rail label={t.home.highlightsTitle}>
        {items.map((a) => (
          <TrendingCard key={a.id} anime={a} />
        ))}
      </Rail>
    </section>
  );
}

/** Os mais novos do catálogo (até o ano atual), com capa. */
export function RecentReleases({ catalog, year }: { catalog: LocalCatalog; year: number | null }) {
  if (year === null) return null;
  const items = catalog.all
    .filter((a) => a.year !== null && a.year <= year && a.year >= year - 1 && a.cover)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title))
    .slice(0, 12);
  if (!items.length) return null;
  return (
    <section>
      <SectionTitle>{t.home.recentTitle}</SectionTitle>
      <Rail label={t.home.recentTitle}>
        {items.map((a) => (
          <TrendingCard key={a.id} anime={a} />
        ))}
      </Rail>
    </section>
  );
}

export function TrendingSection({ snap, catalog }: Props) {
  const [tab, setTab] = useState<"popular" | "friends">("popular");
  const stats = tab === "popular" ? trending(snap.events, 12) : trendingAmongFriends(snap.events, snap.following, 12);
  return (
    <section>
      <SectionTitle action={<Link href="/buscar" className={linkAction}>{t.community.seeCatalog}</Link>}>{t.community.trendingTitle}</SectionTitle>
      <Tabs
        label={t.community.trendingTitle}
        value={tab}
        onChange={setTab}
        tabs={[
          ["popular", t.community.tabPopular],
          ["friends", t.community.tabFriends],
        ]}
      />
      {stats.length === 0 ? (
        <Muted>{tab === "friends" ? t.community.friendsEmpty : t.community.empty}</Muted>
      ) : (
        <Rail label={t.community.trendingTitle}>
          {stats.map((s) => {
            const a = catalog.get(s.animeId);
            if (!a) return null;
            const extra = "friendsWhoRecommend" in s ? t.community.friendsRecommend(s.friendsWhoRecommend as number) : undefined;
            return <TrendingCard key={s.animeId} anime={a} stat={s} extra={extra} />;
          })}
        </Rail>
      )}
    </section>
  );
}

type RankTab = "top" | "watched" | "topEp" | "watchedEp";

export function RankingsSection({ snap, catalog }: Props) {
  const [tab, setTab] = useState<RankTab>("top");
  const [all, setAll] = useState(false);
  const n = all ? 10 : 5;
  const isEp = tab === "topEp" || tab === "watchedEp";
  const rows = tab === "top" ? topRated(snap.events, n) : tab === "watched" ? mostWatched(snap.events, n) : [];
  const epRows = tab === "topEp" ? topEpisodes(snap.episodeEvents, n) : tab === "watchedEp" ? mostWatchedEpisodes(snap.episodeEvents, n) : [];
  const hasMore = (isEp ? (tab === "topEp" ? topEpisodes(snap.episodeEvents, 6) : mostWatchedEpisodes(snap.episodeEvents, 6)) : tab === "top" ? topRated(snap.events, 6) : mostWatched(snap.events, 6)).length > 5;
  const empty = isEp ? epRows.length === 0 : rows.length === 0;
  return (
    <section>
      <SectionTitle>{t.community.rankingsTitle}</SectionTitle>
      <Tabs
        label={t.community.rankingsTitle}
        value={tab}
        onChange={setTab}
        tabs={[
          ["top", t.community.tabTop],
          ["topEp", t.community.tabTopEpisodes],
          ["watched", t.community.tabWatched],
          ["watchedEp", t.community.tabWatchedEpisodes],
        ]}
      />
      {empty ? (
        <Muted>{t.community.empty}</Muted>
      ) : isEp ? (
        <ol className={ruledRows}>
          {epRows.map((s, i) => {
            const a = catalog.get(s.animeId);
            if (!a) return null;
            return (
              <RankRow
                key={`${s.animeId}#${s.episode}`}
                pos={i + 1}
                anime={a}
                title={t.community.episodeOf(s.episode, a.title)}
                href={`/anime/${a.id}#ep-${s.episode}`}
                half={tab === "topEp" ? s.avgHalf : null}
                metric={tab === "topEp" ? t.community.ratings(s.ratings) : t.community.watchers(s.watchers)}
              />
            );
          })}
        </ol>
      ) : (
        <ol className={ruledRows}>
          {rows.map((s, i) => {
            const a = catalog.get(s.animeId);
            if (!a) return null;
            return (
              <RankRow
                key={s.animeId}
                pos={i + 1}
                anime={a}
                half={tab === "top" ? s.avgHalf : null}
                metric={tab === "top" ? t.community.ratings(s.ratings) : t.community.watchers(s.watchers)}
              />
            );
          })}
        </ol>
      )}
      {!empty && (hasMore || all) && <MoreToggle open={all} onToggle={() => setAll(!all)} more={t.home.showTop10} less={t.home.showTop5} />}
    </section>
  );
}

/** "Ver mais / ver menos" no fim de uma lista curta. */
function MoreToggle({ open, onToggle, more, less }: { open: boolean; onToggle: () => void; more: string; less: string }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className={`${linkAction} mt-3 cursor-pointer`}>
      {open ? less : more}
    </button>
  );
}

export function ActivitySection({ snap, catalog }: Props) {
  const [all, setAll] = useState(false);
  const full = activity(snap, 10);
  const items = all ? full : full.slice(0, 5);
  return (
    <section>
      <SectionTitle>{t.community.activityTitle}</SectionTitle>
      {items.length === 0 ? (
        <Muted>{t.community.empty}</Muted>
      ) : (
        <ul className={ruledRows}>
          {items.map((it, i) => {
            const anime = "animeId" in it ? catalog.get(it.animeId) : null;
            if ("animeId" in it && !anime) return null;
            const verb =
              it.kind === "completed" ? t.community.actCompleted
              : it.kind === "rated" ? t.community.actRated
              : it.kind === "reviewed" ? t.community.actReviewed
              : t.community.actList;
            return (
              <li key={i} className="flex items-start gap-3 py-3">
                {anime ? (
                  <Link href={`/anime/${anime.id}`} className="w-9 flex-none" aria-label={anime.title}>
                    <Poster anime={anime} size="xs" />
                  </Link>
                ) : (
                  <span className="grid aspect-[2/3] w-9 flex-none place-items-center rounded-md border border-line text-muted">☰</span>
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <p>
                    <b>@{it.user}</b> <span className="text-muted">{verb}</span>{" "}
                    <b>{anime ? anime.title : it.kind === "list" ? `“${it.listTitle}”` : ""}</b>
                  </p>
                  {it.kind === "reviewed" && <p className="mt-0.5 line-clamp-2 text-muted">“{it.review}”</p>}
                  <p className="mt-0.5 text-xs text-muted">{t.community.ago(it.minutesAgo)}</p>
                </div>
                {(it.kind === "rated" || it.kind === "reviewed") && it.ratingHalf !== null && <Hanko half={it.ratingHalf} size="sm" />}
              </li>
            );
          })}
        </ul>
      )}
      {full.length > 5 && <MoreToggle open={all} onToggle={() => setAll(!all)} more={t.home.showMore} less={t.home.showLess} />}
    </section>
  );
}

export function FeaturedListsSection({ snap, catalog, narrow = false }: Props & { narrow?: boolean }) {
  const lists = [...snap.lists].sort((a, b) => b.likes - a.likes);
  return (
    <section>
      <SectionTitle>{t.community.listsTitle}</SectionTitle>
      {lists.length === 0 ? (
        <Muted>{t.community.empty}</Muted>
      ) : (
        <div className={`grid gap-x-8 gap-y-5 sm:grid-cols-2 ${narrow ? "min-[1120px]:grid-cols-1" : ""}`}>
          {lists.map((l) => (
            <article key={l.id} className="flex items-center gap-4">
              <div className="flex w-36 flex-none -space-x-9">
                {l.animeIds.slice(0, 3).map((id) => {
                  const a = catalog.get(id);
                  return a ? <Poster key={id} anime={a} size="xs" className="w-[3.75rem] ring-2 ring-bg" /> : null;
                })}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold leading-snug">{l.title}</h3>
                <p className="text-xs text-muted">
                  {t.community.by(l.author)} · {t.lists.items(l.animeIds.length)} · {t.community.likes(l.likes)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
