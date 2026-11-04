"use client";

// Armazenamento local (localStorage) enquanto não há banco.
// As telas usam só useDiary()/diary.*; trocar por Supabase depois não muda as telas.
import { useSyncExternalStore } from "react";
import type { Anime, NewAnimeInput } from "@/lib/catalog/provider";
import * as ops from "./ops";
import { EMPTY_STATE, type DiaryState, type WatchStatus } from "./types";

const KEY = "cour:v1";

let state: DiaryState = EMPTY_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DiaryState;
      if (parsed?.version === 1) state = { ...EMPTY_STATE, ...parsed };
    }
  } catch {
    // armazenamento bloqueado ou corrompido: segue com estado vazio
  }
}

function commit(next: DiaryState) {
  if (next === state) return;
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // sem armazenamento: funciona só nesta aba
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      listeners.forEach((fn) => fn());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return state;
}

const getServerSnapshot = () => EMPTY_STATE;

/** Estado do diário. No servidor (e na hidratação) é vazio. */
export function useDiary(): DiaryState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function ctx(): ops.Ctx {
  return { now: new Date().toISOString(), newId: () => crypto.randomUUID() };
}

function current() {
  load();
  return state;
}

export const diary = {
  addEntry(input: ops.NewEntryInput, anime: Anime | null) {
    commit(ops.addEntry(current(), input, anime, ctx()));
  },
  deleteEntry(id: string) {
    commit(ops.deleteEntry(current(), id));
  },
  setStatus(animeId: string, status: WatchStatus | null) {
    commit(ops.setStatus(current(), animeId, status, ctx()));
  },
  plusOneEpisode(anime: Anime) {
    commit(ops.plusOneEpisode(current(), anime, ctx()));
  },
  toggleFavorite(animeId: string) {
    const r = ops.toggleFavorite(current(), animeId);
    commit(r.state);
    return r.ok;
  },
  createList(input: { title: string; description?: string; isRanked?: boolean }) {
    const r = ops.createList(current(), input, ctx());
    commit(r.state);
    return r.id;
  },
  deleteList(id: string) {
    commit(ops.deleteList(current(), id));
  },
  addToList(listId: string, animeId: string) {
    const r = ops.addToList(current(), listId, animeId, ctx());
    commit(r.state);
    return r.added;
  },
  removeFromList(listId: string, animeId: string) {
    commit(ops.removeFromList(current(), listId, animeId, ctx()));
  },
  addCustomAnime(input: NewAnimeInput) {
    const r = ops.addCustomAnime(current(), input, ctx());
    commit(r.state);
    return r.anime;
  },
};
