"use client";

import { useMemo } from "react";
import { useCatalog } from "@/lib/catalog/local";
import { FEATURED_IDS } from "@/lib/catalog/seed";
import { buildDemoSnapshot } from "./demo";
import type { CommunitySnapshot } from "./types";

/**
 * Dados de demonstração (inventados, marcados "demonstração"):
 * - ligados por padrão no `npm run dev`;
 * - em produção só com NEXT_PUBLIC_COMMUNITY_DEMO=1 (ex.: para mostrar o layout na Vercel);
 * - NEXT_PUBLIC_COMMUNITY_DEMO=0 desliga também no dev.
 * Sem demo e sem dados reais, o Início mostra destaques do catálogo.
 */
const FLAG = process.env.NEXT_PUBLIC_COMMUNITY_DEMO;
export const COMMUNITY_DEMO = FLAG === "1" || (FLAG !== "0" && process.env.NODE_ENV === "development");

const EMPTY: CommunitySnapshot = { demo: false, events: [], episodeEvents: [], following: [], lists: [] };

export function useCommunity(): CommunitySnapshot & { ready: boolean } {
  const { ready, all } = useCatalog();
  return useMemo(() => {
    if (!ready) return { ...EMPTY, ready: false };
    if (!COMMUNITY_DEMO) return { ...EMPTY, ready: true };
    return { ...buildDemoSnapshot(all, FEATURED_IDS), ready: true };
  }, [ready, all]);
}
