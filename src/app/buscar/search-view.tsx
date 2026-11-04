"use client";

import { useRouter } from "next/navigation";
import { AnimeSearch } from "@/components/AnimeSearch";
import { AnimeTile, PageTitle, PosterGrid, SectionTitle } from "@/components/ui";
import { seedAnime } from "@/lib/catalog/local";
import { CATALOG_SOURCE, FEATURED_IDS, SEED_ANIME } from "@/lib/catalog/seed";
import { t } from "@/messages";

const featured = FEATURED_IDS.map(seedAnime).filter((a) => a !== null);

export function SearchView() {
  const router = useRouter();
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

      {/* Crédito exigido pela licença ODbL do catálogo */}
      <p className="mt-10 text-xs text-muted">
        {t.search.catalogCredit(SEED_ANIME.length)}{" "}
        <a href={CATALOG_SOURCE.url} className="underline" target="_blank" rel="noopener noreferrer">
          {CATALOG_SOURCE.name}
        </a>{" "}
        ({CATALOG_SOURCE.author}), {CATALOG_SOURCE.license}.
      </p>
    </>
  );
}
