"use client";

import { useMemo, useSyncExternalStore } from "react";
import { diary, useDiary } from "@/lib/diary/store";
import { rankMatches, type Anime, type AnimeCatalogProvider, type NewAnimeInput } from "./provider";
import { loadCatalogFile, type CatalogSource } from "./seed";

type Loaded = { source: CatalogSource; anime: Anime[] };

const NONE: Anime[] = [];
let loaded: Loaded | null = null;
let loading: Promise<Loaded> | null = null;
const listeners = new Set<() => void>();

function ensureLoaded(): Promise<Loaded> {
  loading ??= loadCatalogFile().then((c) => {
    loaded = c;
    listeners.forEach((l) => l());
    return c;
  });
  return loading;
}

function subscribe(l: () => void) {
  void ensureLoaded();
  listeners.add(l);
  return () => listeners.delete(l);
}

export type LocalCatalog = AnimeCatalogProvider & {
  /** false até o arquivo do catálogo chegar */
  ready: boolean;
  size: number;
  /** catálogo base (sem os criados pelo usuário); referência estável */
  all: Anime[];
  source: CatalogSource | null;
  get(id: string): Anime | null;
};

/** Catálogo local: arquivo importado + animes que o usuário adicionou. */
export function createLocalCatalog(base: Loaded | null, custom: Anime[]): LocalCatalog {
  const all = [...(base?.anime ?? []), ...custom];
  const byId = new Map(all.map((a) => [a.id, a]));
  return {
    ready: base !== null,
    size: all.length,
    all: base?.anime ?? NONE,
    source: base?.source ?? null,
    get: (id) => byId.get(id) ?? null,
    search: async (q, opts) => {
      const b = base ?? (await ensureLoaded());
      return rankMatches([...b.anime, ...custom], q, opts?.limit);
    },
    getById: async (id) => byId.get(id) ?? (await ensureLoaded()).anime.find((a) => a.id === id) ?? null,
    create: async (input: NewAnimeInput) => diary.addCustomAnime(input),
  };
}

export function useCatalog(): LocalCatalog {
  const base = useSyncExternalStore(subscribe, () => loaded, () => null);
  const { customAnime } = useDiary();
  return useMemo(() => createLocalCatalog(base, customAnime), [base, customAnime]);
}
