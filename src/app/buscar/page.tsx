import type { Metadata } from "next";
import { Suspense } from "react";
import { t } from "@/messages";
import { SearchRoute, SearchView } from "./search-view";

export const metadata: Metadata = { title: t.search.title };

export default function Page() {
  // ?q= só existe em runtime (useSearchParams): sem ela, a busca vazia de sempre
  return (
    <Suspense fallback={<SearchView />}>
      <SearchRoute />
    </Suspense>
  );
}
