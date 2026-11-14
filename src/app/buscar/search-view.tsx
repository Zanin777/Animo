"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimeSearch } from "@/components/AnimeSearch";
import { Poster, SharedPoster } from "@/components/Poster";
import { Avatar } from "@/components/Avatar";
import { IconSpark } from "@/components/Icons";
import { Tilt } from "@/components/Tilt";
import { nameColorOf } from "@/lib/profile/accents";
import { handleQuery, usePeopleSearch } from "@/lib/social/people";
import { PageTitle, SectionTitle } from "@/components/ui";
import type { Anime } from "@/lib/catalog/provider";
import { useCatalog } from "@/lib/catalog/local";
import { FEATURED_IDS } from "@/lib/catalog/seed";
import { t } from "@/messages";

const grid = "grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5";

/**
 * Pôster da grade: sobe ao passar o mouse (.poster-lift), inclina em 3D (Tilt)
 * e, com shared, "voa" até o topo da página do anime ao abrir.
 */
function Tile({ anime, caption, shared, index }: { anime: Anime; caption?: React.ReactNode; shared: boolean; index?: number }) {
  return (
    <Link
      href={`/anime/${anime.id}`}
      className={`poster-link ${index !== undefined ? "rise" : ""}`}
      style={index !== undefined ? ({ "--i": index } as React.CSSProperties) : undefined}
      aria-label={anime.title}
    >
      <div className="poster-lift">
        <Tilt max={12}>{shared ? <SharedPoster anime={anime} /> : <Poster anime={anime} />}</Tilt>
      </div>
      {caption && <div className="mt-1.5 truncate text-xs text-muted">{caption}</div>}
    </Link>
  );
}

/** Lê ?q= (busca da barra do topo); trocar o texto recria a busca já preenchida. */
export function SearchRoute() {
  const q = useSearchParams().get("q")?.slice(0, 100) ?? "";
  return <SearchView key={q} initialQuery={q} />;
}

export function SearchView({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const catalog = useCatalog();
  const featured = FEATURED_IDS.map(catalog.get).filter((a) => a !== null);
  // o mesmo anime nos resultados e nos destaques: só o dos resultados "voa" (nome repetido cancela a animação)
  const [inResults, setInResults] = useState<Anime[]>([]);
  const resultIds = new Set(inResults.map((a) => a.id));
  const [query, setQuery] = useState(initialQuery);
  const { people, done } = usePeopleSearch(query);
  const atSearch = query.trim().startsWith("@");

  return (
    <>
      <PageTitle>{t.search.title}</PageTitle>
      <AnimeSearch
        large
        autoFocus
        initialQuery={initialQuery}
        placeholder={t.search.placeholderPeople}
        onQuery={setQuery}
        before={
          people.length > 0 ? (
            <section className="mt-5" aria-label={t.search.people}>
              <h2 className="mb-2 text-sm font-bold text-muted">{t.search.people}</h2>
              <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
                {people.map((p, i) => (
                  <li key={p.handle} className="rise flex-none snap-start" style={{ "--i": i } as React.CSSProperties}>
                    <Link
                      href={`/u/${p.handle}`}
                      className="press flex items-center gap-3 rounded-full border border-line bg-card py-2.5 pr-5 pl-3 transition-colors hover:border-active"
                    >
                      <Avatar profile={p} size={40} />
                      <span className="min-w-0">
                        <span className="flex max-w-48 items-center gap-1 font-bold" style={{ color: nameColorOf(p) }}>
                          <span className="truncate">{p.displayName || `@${p.handle}`}</span>
                          {p.role === "plus" && (
                            <span className="flex-none text-accent" title={t.profile.premium}>
                              <IconSpark size={13} strokeWidth={2} />
                              <span className="sr-only">{t.profile.premium}</span>
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-muted">@{p.handle}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : atSearch && done ? (
            <p className="mt-4 text-sm text-muted">{t.search.noPeople(handleQuery(query))}</p>
          ) : null
        }
        onResults={setInResults}
        onPick={(a) => router.push(`/anime/${a.id}`)}
        render={(results) => (
          <>
            <p className="mb-3 text-sm text-muted" aria-live="polite">
              {t.search.resultCount(results.length)}
            </p>
            <div className={grid}>
              {results.map((a, i) => (
                <Tile key={a.id} anime={a} shared index={i} caption={[a.year, t.kind[a.kind]].filter(Boolean).join(" · ")} />
              ))}
            </div>
          </>
        )}
      />
      <SectionTitle>{t.search.catalog}</SectionTitle>
      <div className={grid}>
        {featured.map((a) => (
          <Tile key={a.id} anime={a} shared={!resultIds.has(a.id)} />
        ))}
      </div>

      {/* Créditos exigidos: ODbL (dados) e TMDB (capas) */}
      {catalog.source && (
        <div className="mt-10 grid gap-1 text-xs text-muted">
          <p>
            {t.search.catalogCredit(catalog.size)}{" "}
            <a href={catalog.source.url} className="underline" target="_blank" rel="noopener noreferrer">
              {catalog.source.name}
            </a>{" "}
            ({catalog.source.author}), {catalog.source.license}.
          </p>
          <p>
            {t.search.tmdbCredit}{" "}
            <a href="https://www.themoviedb.org" className="underline" target="_blank" rel="noopener noreferrer">
              TMDB
            </a>
            . {t.search.tmdbNotice}
          </p>
        </div>
      )}
    </>
  );
}
