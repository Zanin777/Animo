"use client";

import { useRouter } from "next/navigation";
import { AnimeSearch } from "@/components/AnimeSearch";
import { AnimeTile, PageTitle, PosterGrid, SectionTitle } from "@/components/ui";
import { useCatalog } from "@/lib/catalog/local";
import { FEATURED_IDS } from "@/lib/catalog/seed";
import { t } from "@/messages";

export function SearchView() {
  const router = useRouter();
  const catalog = useCatalog();
  const featured = FEATURED_IDS.map(catalog.get).filter((a) => a !== null);

  return (
    <>
      <PageTitle>{t.search.title}</PageTitle>
      <AnimeSearch
        autoFocus
        onPick={(a) => router.push(`/anime/${a.id}`)}
        render={(results) => (
          <PosterGrid>
            {results.map((a) => (
              <AnimeTile key={a.id} anime={a} caption={a.year} />
            ))}
          </PosterGrid>
        )}
      />
      <SectionTitle>{t.search.catalog}</SectionTitle>
      <PosterGrid>
        {featured.map((a) => (
          <AnimeTile key={a.id} anime={a} />
        ))}
      </PosterGrid>

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
