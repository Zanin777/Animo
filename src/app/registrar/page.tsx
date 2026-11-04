import type { Metadata } from "next";
import { Suspense } from "react";
import { t } from "@/messages";
import { LogView } from "./log-view";

export const metadata: Metadata = { title: t.log.title };

export default function Page() {
  // LogView lê ?anime= (useSearchParams), que precisa de Suspense.
  return (
    <Suspense>
      <LogView />
    </Suspense>
  );
}
