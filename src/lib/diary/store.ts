"use client";

// Diário do usuário. As telas usam só useDiary()/diary.* (síncrono, rápido).
//
// Convidado: tudo no localStorage ("aniora:v1").
// Logado:    cópia local por conta ("aniora:v1:<id>") + fila de mudanças
//            ("aniora:outbox:<id>") enviada ao Supabase em ordem. Ao entrar,
//            o diário vem do banco; se a conta estiver vazia, o que estava no
//            navegador (convidado) é importado uma vez.
import { useSyncExternalStore } from "react";
import type { Anime, NewAnimeInput } from "@/lib/catalog/provider";
import { onAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import * as ops from "./ops";
import { hasData, importOps, pullState, pushOp, pushProfile, type RemoteOp } from "./remote";
import { EMPTY_PROFILE, EMPTY_STATE, type DiaryState, type WatchStatus } from "./types";

const GUEST_KEY = "aniora:v1";
/** Nome antigo do app (Cour). Lido uma vez e migrado. */
const LEGACY_KEY = "cour:v1";
const userKey = (id: string) => `aniora:v1:${id}`;
const outboxKey = (id: string) => `aniora:outbox:${id}`;

export type SyncStatus = "local" | "syncing" | "synced" | "error";

let state: DiaryState = EMPTY_STATE;
let userId: string | null = null;
let sync: SyncStatus = "local";
let loaded = false;
let outbox: RemoteOp[] = [];
let flushing = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

// ───────── armazenamento local ─────────
function readState(key: string): DiaryState | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiaryState;
    if (parsed?.version !== 1) return null;
    return { ...EMPTY_STATE, ...parsed, profile: { ...EMPTY_PROFILE, ...parsed.profile } };
  } catch {
    return null; // bloqueado ou corrompido
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sem armazenamento: funciona só nesta aba
  }
}
const stateKey = () => (userId ? userKey(userId) : GUEST_KEY);

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    if (!window.localStorage.getItem(GUEST_KEY)) {
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        window.localStorage.setItem(GUEST_KEY, legacy);
        window.localStorage.removeItem(LEGACY_KEY);
      }
    }
  } catch {}
  state = readState(GUEST_KEY) ?? EMPTY_STATE;
  onAuth((a) => {
    if (a.status === "user" && a.userId !== userId) void attach(a.userId);
    if (a.status === "guest" && userId) detach();
  });
}

function setSync(s: SyncStatus) {
  if (s !== sync) {
    sync = s;
    notify();
  }
}

// ───────── fila de mudanças ─────────
function enqueue(list: RemoteOp[]) {
  if (!userId || !list.length) return;
  outbox.push(...list);
  write(outboxKey(userId), outbox);
  void flush();
}

async function flush() {
  const sb = getSupabase();
  if (!sb || !userId || flushing) return;
  flushing = true;
  const uid = userId;
  setSync("syncing");
  let failed = false;
  while (outbox.length && userId === uid) {
    let r: Awaited<ReturnType<typeof pushOp>>;
    try {
      r = await pushOp(sb, uid, outbox[0]);
    } catch {
      r = "retry"; // rede caiu
    }
    if (r === "retry") {
      failed = true;
      break;
    }
    if (r === "drop") console.warn("[aniora] mudança recusada pelo banco e descartada:", outbox[0]);
    outbox.shift();
    write(outboxKey(uid), outbox);
  }
  flushing = false;
  if (userId !== uid) return;
  setSync(failed ? "error" : "synced");
  if (failed) setTimeout(() => void flush(), 15000);
}

if (typeof window !== "undefined") window.addEventListener("online", () => void flush());

// ───────── entrar / sair ─────────
async function attach(uid: string) {
  userId = uid;
  try {
    outbox = JSON.parse(window.localStorage.getItem(outboxKey(uid)) ?? "[]") as RemoteOp[];
  } catch {
    outbox = [];
  }
  // mostra já a cópia local desta conta (se houver), enquanto busca no banco
  state = readState(userKey(uid)) ?? EMPTY_STATE;
  notify();

  const sb = getSupabase();
  if (!sb) return;
  await flush(); // primeiro o que ficou pendente
  if (userId !== uid || outbox.length) return;
  setSync("syncing");
  const remote = await pullState(sb, uid);
  if (userId !== uid) return;
  if (!remote) return setSync("error");

  const guest = readState(GUEST_KEY);
  if (!hasData(remote) && guest && hasData(guest)) {
    // primeiro login: leva o diário do navegador para a conta
    state = { ...guest, profile: remote.profile };
    write(userKey(uid), state);
    notify();
    enqueue(importOps(guest));
    try {
      window.localStorage.removeItem(GUEST_KEY);
    } catch {}
    return;
  }
  state = remote;
  write(userKey(uid), state);
  setSync("synced");
  notify();
}

function detach() {
  userId = null;
  outbox = [];
  state = readState(GUEST_KEY) ?? EMPTY_STATE;
  sync = "local";
  notify();
}

// ───────── React ─────────
function subscribe(l: () => void) {
  load();
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === stateKey()) {
      state = readState(stateKey()) ?? EMPTY_STATE;
      notify();
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

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribe, () => sync, () => "local" as SyncStatus);
}

function ctx(): ops.Ctx {
  return { now: new Date().toISOString(), newId: () => crypto.randomUUID() };
}
function current() {
  load();
  return state;
}
function commit(next: DiaryState, remoteOps: RemoteOp[] = []) {
  if (next === state) return;
  state = next;
  write(stateKey(), state);
  notify();
  enqueue(remoteOps);
}
const listOps = (s: DiaryState, listId: string): RemoteOp[] => {
  const l = s.lists.find((x) => x.id === listId);
  if (!l) return [];
  const { items, ...list } = l;
  return [
    { t: "list.upsert", list },
    { t: "list.items", listId, items },
  ];
};

/** id do usuário logado (para o envio de fotos); null = convidado */
export const currentUserId = () => userId;

export const diary = {
  addEntry(input: ops.NewEntryInput, anime: Anime | null) {
    const next = ops.addEntry(current(), input, anime, ctx());
    commit(next, [
      { t: "library.upsert", item: next.library[input.animeId] },
      { t: "entry.upsert", entry: next.entries[0] },
    ]);
  },
  deleteEntry(id: string) {
    commit(ops.deleteEntry(current(), id), [{ t: "entry.delete", id }]);
  },
  setStatus(animeId: string, status: WatchStatus | null) {
    const next = ops.setStatus(current(), animeId, status, ctx());
    commit(next, [status === null ? { t: "library.delete", animeId } : { t: "library.upsert", item: next.library[animeId] }]);
  },
  plusOneEpisode(anime: Anime) {
    const next = ops.plusOneEpisode(current(), anime, ctx());
    if (next.library[anime.id]) commit(next, [{ t: "library.upsert", item: next.library[anime.id] }]);
  },
  toggleFavorite(animeId: string) {
    const r = ops.toggleFavorite(current(), animeId);
    commit(r.state, r.ok ? [{ t: "favorites.set", ids: r.state.favorites }] : []);
    return r.ok;
  },
  createList(input: { title: string; description?: string; isRanked?: boolean }) {
    const r = ops.createList(current(), input, ctx());
    commit(r.state, listOps(r.state, r.id));
    return r.id;
  },
  deleteList(id: string) {
    commit(ops.deleteList(current(), id), [{ t: "list.delete", id }]);
  },
  addToList(listId: string, animeId: string) {
    const r = ops.addToList(current(), listId, animeId, ctx());
    commit(r.state, r.added ? listOps(r.state, listId) : []);
    return r.added;
  },
  removeFromList(listId: string, animeId: string) {
    const next = ops.removeFromList(current(), listId, animeId, ctx());
    commit(next, listOps(next, listId));
  },
  /** Valida; se logado, grava no banco antes (o @usuário precisa ser único). */
  async saveProfile(input: ops.ProfileInput): Promise<ops.ProfileError | "taken" | "network" | null> {
    const r = ops.updateProfile(current(), input);
    if (r.error) return r.error;
    const sb = getSupabase();
    if (sb && userId) {
      const res = await pushProfile(sb, userId, r.state.profile);
      if (res === "taken") return "taken";
      if (res === "reserved") return "reserved";
      if (res === "error") return "network";
    }
    commit({ ...current(), profile: r.state.profile });
    return null;
  },
  rateEpisode(animeId: string, episode: number, ratingHalf: number | null) {
    commit(ops.rateEpisode(current(), animeId, episode, ratingHalf), [{ t: "episode.set", animeId, episode, ratingHalf }]);
  },
  addCustomAnime(input: NewAnimeInput) {
    const r = ops.addCustomAnime(current(), input, ctx());
    commit(r.state, [{ t: "anime.upsert", anime: r.anime }]);
    return r.anime;
  },
  async signOut() {
    await getSupabase()?.auth.signOut();
  },
};
