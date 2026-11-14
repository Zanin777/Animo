"use client";

import Link from "next/link";
import { EntryRow } from "@/components/EntryRow";
import { IconPlus } from "@/components/Icons";
import { openLog } from "@/components/LogDrawer";
import { Poster } from "@/components/Poster";
import { Rail } from "@/components/Rail";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Muted, SectionTitle, btnGhost, btnPrimary, linkAction, rows } from "@/components/ui";
import type { Anime } from "@/lib/catalog/provider";
import { useCatalog } from "@/lib/catalog/local";
import { useCommunity } from "@/lib/community";
import { diary, useDiary } from "@/lib/diary/store";
import type { LibraryItem } from "@/lib/diary/types";
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
import { Spotlight, spotlightSlides } from "./home-spotlight";

type Watching = { item: LibraryItem; anime: Anime };

/**
 * Início. Ordem: o que é seu (saudação, continuar assistindo) → faixa de capas →
 * comunidade (Em alta; Rankings e Atividade lado a lado no computador) → listas e diário.
 * Em telas largas (≥1120px) o Início ocupa 64rem em vez da coluna estreita das outras páginas.
 */
export function HomeView() {
  const state = useDiary();
  const catalog = useCatalog();
  const snap = useCommunity();
  const year = useCurrentYear();
  const hasCommunity = snap.events.length > 0;

  const watching: Watching[] = Object.values(state.library)
    .filter((l) => l.status === "watching")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((l) => ({ item: l, anime: catalog.get(l.animeId) }))
    .filter((x): x is Watching => x.anime !== null);

  const entries = [...state.entries]
    .sort((a, b) => b.watchedOn.localeCompare(a.watchedOn) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const isNew = state.entries.length === 0 && Object.keys(state.library).length === 0;

  return (
    <div className="min-[1120px]:-mx-36">
      {/* celular: não há barra no topo, então o logo e o tema ficam aqui */}
      <div className="mb-4 flex items-center justify-between md:hidden">
        <span className="font-display text-3xl leading-none">
          aniora<span className="text-accent">.</span>
        </span>
        <ThemeSwitch />
      </div>

      {catalog.ready && snap.ready && (
        <div className="mb-8">
          <Spotlight slides={spotlightSlides(snap, catalog)} />
        </div>
      )}

      {isNew ? <Welcome /> : <Hello name={state.profile.displayName} watching={watching} />}

      {catalog.ready && (
        <div className="mt-6">
          <CoverMarquee items={marqueeItems(snap, catalog)} />
        </div>
      )}

      {snap.ready && hasCommunity && (
        <>
          {snap.demo && (
            <p className="mt-10 flex items-start gap-2.5 border-y border-line py-3 text-sm text-muted">
              <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-detail" aria-hidden="true" />
              {t.home.demoNotice}
            </p>
          )}
          <TrendingSection snap={snap} catalog={catalog} />
          <div className="min-[1120px]:grid min-[1120px]:grid-cols-2 min-[1120px]:gap-x-12">
            <RankingsSection snap={snap} catalog={catalog} />
            <ActivitySection snap={snap} catalog={catalog} />
          </div>
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

      <div className={entries.length > 0 && snap.ready && hasCommunity ? "min-[1120px]:grid min-[1120px]:grid-cols-2 min-[1120px]:gap-x-12" : ""}>
        {snap.ready && hasCommunity && <FeaturedListsSection snap={snap} catalog={catalog} narrow={entries.length > 0} />}
        {entries.length > 0 && (
          <section>
            <SectionTitle action={<Link href="/perfil" className={linkAction}>{t.home.seeDiary}</Link>}>{t.home.diaryTitle}</SectionTitle>
            <div className={rows}>
              {entries.map((e) => {
                const anime = catalog.get(e.animeId);
                return anime ? <EntryRow key={e.id} entry={e} anime={anime} /> : null;
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/** Primeira visita: o convite para começar o diário vem antes de tudo. */
function Welcome() {
  return (
    <section className="grid gap-6 pt-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-10">
      <div>
        <h1 className="max-w-[17ch] font-display text-4xl leading-[1.05] text-balance md:text-5xl">{t.home.newTitle}</h1>
        <p className="mt-4 max-w-[54ch] text-muted">{t.home.newText}</p>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        <button type="button" onClick={() => openLog()} className={`${btnPrimary} px-5 py-2.5 text-base`}>
          <IconPlus size={18} strokeWidth={2.25} />
          {t.home.newCta}
        </button>
        <Link href="/buscar" className={`${btnGhost} border border-line px-4 py-2.5 text-base`}>
          {t.home.exploreCta}
        </Link>
      </div>
    </section>
  );
}

/** Quem já usa: saudação e o que está assistindo, com +1 ep à mão. */
function Hello({ name, watching }: { name: string; watching: Watching[] }) {
  return (
    <section className="pt-2">
      {/* o botão de registrar já está na barra (computador) e no + de baixo (celular) */}
      <h1 className="font-display text-4xl leading-none md:text-5xl">{name ? t.home.hello(name) : t.home.helloAnon}</h1>
      <p className="mt-3 text-muted">{t.home.watchingCount(watching.length)}</p>

      {watching.length > 0 && (
        <>
          <h2 className="mt-8 text-[1.15rem] leading-tight font-bold">{t.home.continueTitle}</h2>
          <Rail label={t.home.continueTitle}>
            {watching.map((w) => (
              <ContinueCard key={w.item.animeId} {...w} />
            ))}
          </Rail>
        </>
      )}
    </section>
  );
}

function ContinueCard({ item, anime }: Watching) {
  const total = anime.episodes;
  const pct = total ? Math.min(100, Math.round((item.episodesWatched / total) * 100)) : null;
  const done = total !== null && item.episodesWatched >= total;
  return (
    <article className="flex w-[19rem] flex-none snap-start gap-3 rounded-lg bg-card p-3">
      <Link href={`/anime/${anime.id}`} className="poster-link w-16 flex-none" aria-label={anime.title}>
        <Poster anime={anime} size="xs" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/anime/${anime.id}`} className="line-clamp-2 leading-snug font-bold hover:underline">
          {anime.title}
        </Link>
        <span className="mt-1 text-xs text-muted tabular-nums">{t.home.episodeOf(item.episodesWatched, total)}</span>
        {pct !== null && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={anime.title}>
            <div className="h-full rounded-full bg-detail transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
        )}
        <button
          type="button"
          disabled={done}
          onClick={() => diary.plusOneEpisode(anime)}
          className="press mt-auto cursor-pointer self-start rounded-md border border-line px-2.5 py-1 text-xs font-bold text-fg transition-colors hover:border-detail hover:text-detail disabled:cursor-default disabled:opacity-40"
        >
          {t.home.plusOne}
        </button>
      </div>
    </article>
  );
}
