"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoBadge, RankRow, Tabs, TrendingCard } from "@/components/community";
import { Hanko } from "@/components/Hanko";
import { Poster } from "@/components/Poster";
import { Muted, SectionTitle, btnGhost, card } from "@/components/ui";
import type { Anime } from "@/lib/catalog/provider";
import type { LocalCatalog } from "@/lib/catalog/local";
import { activity, mostWatched, topRated, trending, trendingAmongFriends } from "@/lib/community/aggregate";
import type { CommunitySnapshot } from "@/lib/community/types";
import { t } from "@/messages";

type Props = { snap: CommunitySnapshot; catalog: LocalCatalog };

/** Capas passando no topo (os mais em alta). Pausa ao passar o mouse. */
export function CoverMarquee({ snap, catalog }: Props) {
  const items = trending(snap.events, 14)
    .map((s) => catalog.get(s.animeId))
    .filter((a): a is Anime => a !== null);
  if (items.length < 6) return null;
  return (
    <div className="marquee -mx-4 mb-2 overflow-hidden px-4 py-2" aria-label={t.community.trendingTitle}>
      <div className="marquee-track">
        {[...items, ...items].map((a, i) => (
          <Link key={`${a.id}-${i}`} href={`/anime/${a.id}`} className="block w-24 flex-none sm:w-28" tabIndex={i >= items.length ? -1 : 0} aria-label={a.title} aria-hidden={i >= items.length}>
            <Poster anime={a} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TrendingSection({ snap, catalog }: Props) {
  const [tab, setTab] = useState<"popular" | "friends">("popular");
  const stats = tab === "popular" ? trending(snap.events, 12) : trendingAmongFriends(snap.events, snap.following, 12);
  return (
    <section>
      <SectionTitle>
        {t.community.trendingTitle}
        <DemoBadge show={snap.demo} />
      </SectionTitle>
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
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3">
          {stats.map((s) => {
            const a = catalog.get(s.animeId);
            if (!a) return null;
            const extra = "friendsWhoRecommend" in s ? t.community.friendsRecommend(s.friendsWhoRecommend as number) : undefined;
            return <TrendingCard key={s.animeId} anime={a} stat={s} extra={extra} />;
          })}
        </div>
      )}
      <Link href="/buscar" className={`${btnGhost} mt-3`}>
        {t.community.seeCatalog} →
      </Link>
    </section>
  );
}

export function RankingsSection({ snap, catalog }: Props) {
  const [tab, setTab] = useState<"top" | "watched">("top");
  const rows = tab === "top" ? topRated(snap.events, 10) : mostWatched(snap.events, 10);
  return (
    <section>
      <SectionTitle>
        {t.community.rankingsTitle}
        <DemoBadge show={snap.demo} />
      </SectionTitle>
      <Tabs
        label={t.community.rankingsTitle}
        value={tab}
        onChange={setTab}
        tabs={[
          ["top", t.community.tabTop],
          ["watched", t.community.tabWatched],
        ]}
      />
      {rows.length === 0 ? (
        <Muted>{t.community.empty}</Muted>
      ) : (
        <ol className={`${card} grid gap-0.5 p-2`}>
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
    </section>
  );
}

export function ActivitySection({ snap, catalog }: Props) {
  const items = activity(snap, 8);
  return (
    <section>
      <SectionTitle>
        {t.community.activityTitle}
        <DemoBadge show={snap.demo} />
      </SectionTitle>
      {items.length === 0 ? (
        <Muted>{t.community.empty}</Muted>
      ) : (
        <ul className="grid gap-2">
          {items.map((it, i) => {
            const anime = "animeId" in it ? catalog.get(it.animeId) : null;
            if ("animeId" in it && !anime) return null;
            const verb =
              it.kind === "completed" ? t.community.actCompleted
              : it.kind === "rated" ? t.community.actRated
              : it.kind === "reviewed" ? t.community.actReviewed
              : t.community.actList;
            return (
              <li key={i} className={`${card} flex items-start gap-3 p-3`}>
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
    </section>
  );
}

export function FeaturedListsSection({ snap, catalog }: Props) {
  const lists = [...snap.lists].sort((a, b) => b.likes - a.likes);
  return (
    <section>
      <SectionTitle>
        {t.community.listsTitle}
        <DemoBadge show={snap.demo} />
      </SectionTitle>
      {lists.length === 0 ? (
        <Muted>{t.community.empty}</Muted>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lists.map((l) => (
            <article key={l.id} className={`${card} flex items-center gap-4 p-3`}>
              <div className="flex w-28 flex-none -space-x-7">
                {l.animeIds.slice(0, 4).map((id) => {
                  const a = catalog.get(id);
                  return a ? <Poster key={id} anime={a} size="xs" className="w-11 ring-2 ring-card" /> : null;
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
