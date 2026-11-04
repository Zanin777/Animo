import { describe, expect, test } from "vitest";
import * as ops from "./diary/ops";
import { hasData, importOps, rowsToState } from "./diary/remote";
import { EMPTY_STATE } from "./diary/types";

let n = 0;
const ctx: ops.Ctx = { now: "2026-11-04T12:00:00.000Z", newId: () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}` };

describe("ponte com o Supabase", () => {
  test("linhas do banco viram o estado do diário", () => {
    const s = rowsToState({
      entries: [{ id: "e1", anime_id: "frieren", rating_half: 9, review: null, watched_on: "2026-11-02", is_rewatch: false, created_at: "2026-11-02T10:00:00Z" }],
      library: [{ anime_id: "frieren", status: "watched", episodes_watched: 28, updated_at: "2026-11-02T10:00:00Z" }],
      favorites: [
        { anime_id: "b", position: 2 },
        { anime_id: "a", position: 1 },
      ],
      lists: [{ id: "l1", title: "Top", description: null, is_ranked: true, created_at: "x", updated_at: "y", list_items: [{ anime_id: "z", position: 2 }, { anime_id: "w", position: 1 }] }],
      episodeRatings: [{ anime_id: "frieren", episode: 3, rating_half: 10 }],
      profile: { username: "matheus", display_name: "Matheus", bio: "" },
      customAnime: [],
    });
    expect(s.entries[0]).toMatchObject({ id: "e1", animeId: "frieren", ratingHalf: 9 });
    expect(s.library.frieren.episodesWatched).toBe(28);
    expect(s.favorites).toEqual(["a", "b"]);
    expect(s.lists[0].items.map((i) => i.animeId)).toEqual(["w", "z"]);
    expect(s.episodeRatings).toEqual({ frieren: { 3: 10 } });
    expect(s.profile).toEqual({ displayName: "Matheus", handle: "matheus", bio: "" });
  });

  test("importação leva tudo, com animes do usuário primeiro (FK)", () => {
    let s = ops.addCustomAnime(EMPTY_STATE, { title: "Meu anime" }, ctx).state;
    const custom = s.customAnime[0].id;
    s = ops.addEntry(s, { animeId: custom, ratingHalf: 8, watchedOn: "2026-11-01" }, null, ctx);
    s = ops.toggleFavorite(s, custom).state;
    const l = ops.createList(s, { title: "L" }, ctx);
    s = ops.addToList(l.state, l.id, custom, ctx).state;
    s = ops.rateEpisode(s, custom, 1, 7);
    const kinds = importOps(s).map((o) => o.t);
    expect(kinds[0]).toBe("anime.upsert");
    expect(kinds).toEqual(expect.arrayContaining(["library.upsert", "entry.upsert", "favorites.set", "list.upsert", "list.items", "episode.set"]));
    expect(kinds.indexOf("list.upsert")).toBeLessThan(kinds.indexOf("list.items"));
  });

  test("conta vazia x com dados", () => {
    expect(hasData(EMPTY_STATE)).toBe(false);
    expect(hasData(ops.rateEpisode(EMPTY_STATE, "x", 1, 5))).toBe(true);
  });
});
