import type { Metadata } from "next";
import { t } from "@/messages";
import { SearchView } from "./search-view";

export const metadata: Metadata = { title: t.search.title };

export default function Page() {
  return <SearchView />;
}
