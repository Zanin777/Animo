"use client";

import { useMemo } from "react";
import { useDiary, diary } from "@/lib/diary/store";
import { rankMatches, type Anime, type AnimeCatalogProvider, type NewAnimeInput } from "./provider";
import { SEED_ANIME } from "./seed";

const SEED_BY_ID = new Map(SEED_ANIME.map((a) => [a.id, a]));

/** Catálogo local: seed + animes que o usuário adicionou. */
export function createLocalCatalog(custom: Anime[]): AnimeCatalogProvider & { get(id: string): Anime | null } {
  const all = [...SEED_ANIME, ...custom];
  const byId = new Map(all.map((a) => [a.id, a]));
  return {
    get: (id) => byId.get(id) ?? null,
    search: async (q, opts) => rankMatches(all, q, opts?.limit),
    getById: async (id) => byId.get(id) ?? null,
    create: async (input: NewAnimeInput) => diary.addCustomAnime(input),
  };
}

export function useCatalog() {
  const { customAnime } = useDiary();
  return useMemo(() => createLocalCatalog(customAnime), [customAnime]);
}

export const seedAnime = (id: string) => SEED_BY_ID.get(id) ?? null;
