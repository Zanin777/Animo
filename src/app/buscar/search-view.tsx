"use client";

import { useRouter } from "next/navigation";
import { AnimeSearch } from "@/components/AnimeSearch";
import { AnimeTile, PageTitle, PosterGrid, SectionTitle } from "@/components/ui";
import { SEED_ANIME } from "@/lib/catalog/seed";
import { t } from "@/messages";

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
        {SEED_ANIME.slice(0, 15).map((a) => (
          <AnimeTile key={a.id} anime={a} />
        ))}
      </PosterGrid>
    </>
  );
}
