"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LogForm } from "@/components/LogForm";
import { PageTitle } from "@/components/ui";
import { t } from "@/messages";

/** Página /registrar (link direto ou sem JS). O caminho normal é a gaveta. */
export function LogView() {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <>
      <PageTitle>{t.log.title}</PageTitle>
      <LogForm
        presetId={params.get("anime")}
        onSaved={() => router.push("/")}
        onClearPreset={() => router.replace("/registrar")}
      />
    </>
  );
}
