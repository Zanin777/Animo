"use client";

import { useMemo } from "react";
import { useCatalog } from "@/lib/catalog/local";
import { FEATURED_IDS } from "@/lib/catalog/seed";
import { buildDemoSnapshot } from "./demo";
import type { CommunitySnapshot } from "./types";

/**
 * Demonstração só em desenvolvimento (`npm run dev`). Em produção as seções
 * da comunidade mostram estado vazio até existirem dados reais (Supabase).
 */
export const COMMUNITY_DEMO = process.env.NODE_ENV === "development";

const EMPTY: CommunitySnapshot = { demo: false, events: [], following: [], lists: [] };

export function useCommunity(): CommunitySnapshot & { ready: boolean } {
  const { ready, all } = useCatalog();
  return useMemo(() => {
    if (!ready) return { ...EMPTY, ready: false };
    if (!COMMUNITY_DEMO) return { ...EMPTY, ready: true };
    return { ...buildDemoSnapshot(all, FEATURED_IDS), ready: true };
  }, [ready, all]);
}
