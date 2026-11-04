import { Suspense } from "react";
import { AnimeView } from "./anime-view";

export default function Page() {
  // O id vem da URL (useParams), que é dado de runtime: precisa de Suspense.
  return (
    <Suspense>
      <AnimeView />
    </Suspense>
  );
}
