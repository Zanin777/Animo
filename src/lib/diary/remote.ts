// Ponte diário ⇄ Supabase. Funções puras de conversão (testáveis) + chamadas ao banco.
// A segurança é do RLS: aqui só montamos as linhas; o banco recusa o que não for do usuário.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Anime, AnimeKind } from "@/lib/catalog/provider";
import { EMPTY_STATE, type DiaryList, type DiaryState, type Entry, type LibraryItem } from "./types";

/** Uma mudança a mandar para o banco (fica numa fila até dar certo). */
export type RemoteOp =
  | { t: "entry.upsert"; entry: Entry }
  | { t: "entry.delete"; id: string }
  | { t: "library.upsert"; item: LibraryItem }
  | { t: "library.delete"; animeId: string }
  | { t: "favorites.set"; ids: string[] }
  | { t: "list.upsert"; list: Omit<DiaryList, "items"> }
  | { t: "list.delete"; id: string }
  | { t: "list.items"; listId: string; items: { animeId: string; position: number }[] }
  | { t: "anime.upsert"; anime: Anime }
  | { t: "episode.set"; animeId: string; episode: number; ratingHalf: number | null };

export type PushResult = "ok" | "retry" | "drop";

/** Erros de dados (constraint, FK, permissão) não melhoram tentando de novo. */
function classify(error: { code?: string } | null): PushResult {
  if (!error) return "ok";
  const c = error.code ?? "";
  return c.startsWith("23") || c.startsWith("22") || c === "42501" || c.startsWith("PGRST") ? "drop" : "retry";
}

export async function pushOp(sb: SupabaseClient, uid: string, op: RemoteOp): Promise<PushResult> {
  switch (op.t) {
    case "entry.upsert": {
      const e = op.entry;
      const { error } = await sb.from("entries").upsert({
        id: e.id,
        user_id: uid,
        anime_id: e.animeId,
        rating_half: e.ratingHalf,
        review: e.review,
        watched_on: e.watchedOn,
        is_rewatch: e.isRewatch,
        created_at: e.createdAt,
      });
      return classify(error);
    }
    case "entry.delete":
      return classify((await sb.from("entries").delete().eq("id", op.id).eq("user_id", uid)).error);
    case "library.upsert": {
      const i = op.item;
      const { error } = await sb.from("library").upsert({
        user_id: uid,
        anime_id: i.animeId,
        status: i.status,
        episodes_watched: i.episodesWatched,
      });
      return classify(error);
    }
    case "library.delete":
      return classify((await sb.from("library").delete().eq("user_id", uid).eq("anime_id", op.animeId)).error);
    case "favorites.set":
      return classify((await sb.rpc("set_favorites", { anime_ids: op.ids })).error);
    case "list.upsert": {
      const l = op.list;
      const { error } = await sb.from("lists").upsert({
        id: l.id,
        user_id: uid,
        title: l.title,
        description: l.description,
        is_ranked: l.isRanked,
        created_at: l.createdAt,
      });
      return classify(error);
    }
    case "list.delete":
      return classify((await sb.from("lists").delete().eq("id", op.id).eq("user_id", uid)).error);
    case "list.items": {
      const del = await sb.from("list_items").delete().eq("list_id", op.listId);
      if (del.error) return classify(del.error);
      if (!op.items.length) return "ok";
      const ins = await sb.from("list_items").insert(op.items.map((i) => ({ list_id: op.listId, anime_id: i.animeId, position: i.position })));
      return classify(ins.error);
    }
    case "anime.upsert": {
      const a = op.anime;
      const { error } = await sb.from("anime").upsert({
        id: a.id,
        title: a.title,
        title_original: a.titleOriginal,
        year: a.year,
        kind: a.kind,
        episodes: a.episodes,
        created_by: uid,
        is_verified: false,
      });
      return classify(error);
    }
    case "episode.set": {
      const q =
        op.ratingHalf === null
          ? sb.from("episode_ratings").delete().eq("user_id", uid).eq("anime_id", op.animeId).eq("episode", op.episode)
          : sb.from("episode_ratings").upsert({ user_id: uid, anime_id: op.animeId, episode: op.episode, rating_half: op.ratingHalf });
      return classify((await q).error);
    }
  }
}

/** Tudo que um diário local tem, como operações (para importar no primeiro login). */
export function importOps(s: DiaryState): RemoteOp[] {
  const ops: RemoteOp[] = [];
  for (const a of s.customAnime) ops.push({ t: "anime.upsert", anime: a }); // antes: são FK das outras
  for (const item of Object.values(s.library)) ops.push({ t: "library.upsert", item });
  for (const entry of s.entries) ops.push({ t: "entry.upsert", entry });
  if (s.favorites.length) ops.push({ t: "favorites.set", ids: s.favorites });
  for (const { items, ...list } of s.lists) {
    ops.push({ t: "list.upsert", list });
    ops.push({ t: "list.items", listId: list.id, items });
  }
  for (const [animeId, eps] of Object.entries(s.episodeRatings))
    for (const [ep, half] of Object.entries(eps)) ops.push({ t: "episode.set", animeId, episode: Number(ep), ratingHalf: half });
  return ops;
}

export function hasData(s: DiaryState) {
  return s.entries.length > 0 || Object.keys(s.library).length > 0 || s.lists.length > 0 || s.favorites.length > 0 || Object.keys(s.episodeRatings).length > 0;
}

type Row = Record<string, unknown>;
const RANGE = [0, 9999] as const;

/** Lê o diário inteiro do usuário no banco. null = falhou (rede): mantenha o local. */
export async function pullState(sb: SupabaseClient, uid: string): Promise<DiaryState | null> {
  const [entries, library, favs, lists, eps, profile, custom] = await Promise.all([
    sb.from("entries").select("id, anime_id, rating_half, review, watched_on, is_rewatch, created_at").eq("user_id", uid).range(...RANGE),
    sb.from("library").select("anime_id, status, episodes_watched, updated_at").eq("user_id", uid).range(...RANGE),
    sb.from("favorites").select("anime_id, position").eq("user_id", uid).order("position"),
    sb.from("lists").select("id, title, description, is_ranked, created_at, updated_at, list_items(anime_id, position)").eq("user_id", uid).range(...RANGE),
    sb.from("episode_ratings").select("anime_id, episode, rating_half").eq("user_id", uid).range(...RANGE),
    sb.from("profiles").select("username, display_name, bio").eq("id", uid).maybeSingle(),
    sb.from("anime").select("id, title, title_original, year, kind, episodes").eq("created_by", uid).range(...RANGE),
  ]);
  if ([entries, library, favs, lists, eps, profile, custom].some((r) => r.error)) return null;
  return rowsToState({
    entries: entries.data as Row[],
    library: library.data as Row[],
    favorites: favs.data as Row[],
    lists: lists.data as Row[],
    episodeRatings: eps.data as Row[],
    profile: (profile.data as Row | null) ?? null,
    customAnime: custom.data as Row[],
  });
}

/** Linhas do banco → DiaryState (pura, testada). */
export function rowsToState(r: {
  entries: Row[];
  library: Row[];
  favorites: Row[];
  lists: Row[];
  episodeRatings: Row[];
  profile: Row | null;
  customAnime: Row[];
}): DiaryState {
  const library: DiaryState["library"] = {};
  for (const l of r.library)
    library[l.anime_id as string] = {
      animeId: l.anime_id as string,
      status: l.status as LibraryItem["status"],
      episodesWatched: Number(l.episodes_watched) || 0,
      updatedAt: String(l.updated_at),
    };
  const episodeRatings: DiaryState["episodeRatings"] = {};
  for (const e of r.episodeRatings) {
    const id = e.anime_id as string;
    (episodeRatings[id] ??= {})[String(e.episode)] = Number(e.rating_half);
  }
  return {
    ...EMPTY_STATE,
    entries: r.entries.map((e) => ({
      id: e.id as string,
      animeId: e.anime_id as string,
      ratingHalf: (e.rating_half as number | null) ?? null,
      review: (e.review as string | null) ?? null,
      watchedOn: String(e.watched_on),
      isRewatch: Boolean(e.is_rewatch),
      createdAt: String(e.created_at),
    })),
    library,
    favorites: [...r.favorites].sort((a, b) => Number(a.position) - Number(b.position)).map((f) => f.anime_id as string),
    lists: r.lists.map((l) => ({
      id: l.id as string,
      title: l.title as string,
      description: (l.description as string | null) ?? null,
      isRanked: Boolean(l.is_ranked),
      createdAt: String(l.created_at),
      updatedAt: String(l.updated_at),
      items: ((l.list_items as Row[] | null) ?? [])
        .map((i) => ({ animeId: i.anime_id as string, position: Number(i.position) }))
        .sort((a, b) => a.position - b.position),
    })),
    episodeRatings,
    customAnime: r.customAnime.map((a) => ({
      id: a.id as string,
      title: a.title as string,
      titleOriginal: (a.title_original as string | null) ?? null,
      aliases: [],
      year: (a.year as number | null) ?? null,
      kind: a.kind as AnimeKind,
      episodes: (a.episodes as number | null) ?? null,
      cover: null,
      genres: [],
      tmdb: null,
      isVerified: false,
    })),
    profile: {
      displayName: (r.profile?.display_name as string) ?? "",
      handle: (r.profile?.username as string) ?? "",
      bio: (r.profile?.bio as string) ?? "",
    },
  };
}

/** Salva o perfil no banco. "taken" = @usuário já existe. */
export async function pushProfile(
  sb: SupabaseClient,
  uid: string,
  p: { displayName: string; handle: string; bio: string },
): Promise<"ok" | "taken" | "error"> {
  const patch: Row = { display_name: p.displayName, bio: p.bio };
  if (p.handle) patch.username = p.handle;
  const { error } = await sb.from("profiles").update(patch).eq("id", uid);
  if (!error) return "ok";
  return error.code === "23505" ? "taken" : "error";
}
