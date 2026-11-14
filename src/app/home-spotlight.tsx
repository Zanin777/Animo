"use client";

// Topo do Início: um anime em destaque por vez, com a capa desfocada de fundo.
// Troca sozinho; pausa com o mouse em cima, com foco dentro ou com "reduzir movimento".
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Genres } from "@/components/community";
import { IconPlus } from "@/components/Icons";
import { openLog } from "@/components/LogDrawer";
import { Poster, coverUrl } from "@/components/Poster";
import { SynopsisSnippet } from "@/components/Synopsis";
import { btnGhost, btnPrimary } from "@/components/ui";
import type { Anime } from "@/lib/catalog/provider";
import type { LocalCatalog } from "@/lib/catalog/local";
import { FEATURED_IDS } from "@/lib/catalog/seed";
import { trending } from "@/lib/community/aggregate";
import type { AnimeStat, CommunitySnapshot } from "@/lib/community/types";
import { formatRating } from "@/lib/rating";
import { t } from "@/messages";

type Slide = { anime: Anime; stat?: AnimeStat };
const ROTATE_MS = 7000;
const MAX = 5;

/** Em alta na comunidade (com nota); sem comunidade ainda, os destaques fixos do catálogo. Só com capa. */
export function spotlightSlides(snap: CommunitySnapshot, catalog: LocalCatalog): Slide[] {
  const slide = (anime: Anime | null, stat?: AnimeStat): Slide[] => (anime && coverUrl(anime) ? [{ anime, stat }] : []);
  const hot = trending(snap.events, MAX * 2)
    .flatMap((stat) => slide(catalog.get(stat.animeId), stat))
    .slice(0, MAX);
  if (hot.length >= 3) return hot;
  return FEATURED_IDS.flatMap((id) => slide(catalog.get(id))).slice(0, MAX);
}

export function Spotlight({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((n) => (n + 1) % slides.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  if (!slides.length) return null;
  const { anime, stat } = slides[index % slides.length];
  const bg = coverUrl(anime);
  const meta = [
    stat?.avgHalf != null ? `★ ${formatRating(stat.avgHalf)}` : null,
    anime.year,
    t.kind[anime.kind],
    anime.episodes ? t.home.spotEpisodes(anime.episodes) : null,
  ].filter(Boolean);

  return (
    <section
      aria-roledescription="carrossel"
      aria-label={t.home.spotLabel}
      className="relative isolate overflow-hidden rounded-2xl border border-line bg-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {bg && (
        <Image
          key={`bg-${anime.id}`}
          src={bg}
          alt=""
          fill
          sizes="480px"
          priority={index === 0}
          className="spot-in -z-10 scale-125 object-cover blur-xl saturate-150"
        />
      )}
      {/* escurece para o texto ficar legível nos dois temas */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/75 to-bg/10" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg/80 via-transparent to-transparent" aria-hidden="true" />

      <div key={anime.id} className="spot-in grid grid-cols-[6.5rem_minmax(0,1fr)] items-end gap-5 p-5 sm:grid-cols-[9rem_minmax(0,1fr)] md:grid-cols-[12rem_minmax(0,1fr)] md:gap-8 md:p-9">
        <Link href={`/anime/${anime.id}`} className="poster-link shadow-2xl" aria-label={anime.title}>
          <Poster anime={anime} />
        </Link>
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.18em] text-detail uppercase">{stat ? t.home.spotHot : t.home.spotPick}</p>
          <h2 className="mt-2 line-clamp-2 font-display text-2xl leading-[1.05] text-balance sm:text-3xl md:text-5xl">
            <Link href={`/anime/${anime.id}`} className="hover:underline">
              {anime.title}
            </Link>
          </h2>
          <p className="mt-2 text-sm text-muted tabular-nums">{meta.join(" · ")}</p>
          <div className="mt-1 hidden sm:block">
            <Genres anime={anime} />
          </div>
          <SynopsisSnippet anime={anime} className="mt-3 hidden max-w-[60ch] text-sm leading-relaxed text-fg/85 md:[display:-webkit-box]" />
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => openLog(anime.id)} className={`${btnPrimary} px-4 py-2`}>
              <IconPlus size={16} strokeWidth={2.25} />
              {t.home.logCta}
            </button>
            <Link href={`/anime/${anime.id}`} className={`${btnGhost} border border-line bg-bg/40 px-4 py-2`}>
              {t.home.spotSee}
            </Link>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="flex justify-end gap-1.5 px-5 pb-4 md:absolute md:right-6 md:bottom-6 md:p-0">
          {slides.map((s, i) => (
            <button
              key={s.anime.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t.home.spotGoTo(i + 1, slides.length, s.anime.title)}
              aria-current={i === index ? "true" : undefined}
              className={`h-2 cursor-pointer rounded-full transition-all ${i === index ? "w-6 bg-detail" : "w-2 bg-fg/30 hover:bg-fg/60"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
