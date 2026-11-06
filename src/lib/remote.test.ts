import { describe, expect, test } from "vitest";
import * as ops from "./diary/ops";
import { hasData, importOps, rowToProfile, rowsToState } from "./diary/remote";
import { EMPTY_PROFILE, EMPTY_STATE, showsAds } from "./diary/types";
import { rankReviews } from "./community/reviews";

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
    expect(s.profile).toEqual({ ...EMPTY_PROFILE, displayName: "Matheus", handle: "matheus", bio: "" });
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

describe("personalização do perfil", () => {
  test("linha do banco: cor e nível desconhecidos viram o padrão", () => {
    const p = rowToProfile({ username: "x", display_name: "X", bio: "", accent: "neon", role: "admin", featured_note: null });
    expect(p.accent).toBeNull();
    expect(p.role).toBe("user");
    expect(p.featuredNote).toBe("");
    expect(rowToProfile({ username: "z", accent: "jade", role: "dev" })).toMatchObject({ accent: "jade", role: "dev" });
  });

  test("foto vale para todos; capa, cor e destaque só para plus/dev", () => {
    const base = { displayName: "A", handle: "aaa", bio: "" };
    const foto = ops.updateProfile(EMPTY_STATE, { ...base, avatarUrl: "/x.webp" });
    expect(foto.error).toBeNull();
    expect(foto.state.profile.avatarUrl).toBe("/x.webp");

    const cor = ops.updateProfile(EMPTY_STATE, { ...base, accent: "jade" });
    expect(cor.error).toBe("reserved");
    expect(cor.state).toBe(EMPTY_STATE);

    const dev = { ...EMPTY_STATE, profile: { ...EMPTY_PROFILE, role: "dev" as const } };
    const ok = ops.updateProfile(dev, { ...base, accent: "jade", featuredAnimeId: "frieren", featuredNote: "  favorito  " });
    expect(ok.error).toBeNull();
    expect(ok.state.profile).toMatchObject({ accent: "jade", featuredAnimeId: "frieren", featuredNote: "favorito", role: "dev" });
    expect(ops.updateProfile(dev, { ...base, accent: "neon" as never }).error).toBe("accent");
    expect(ops.updateProfile(dev, { ...base, featuredNote: "x".repeat(121) }).error).toBe("featuredNote");
  });
});

describe("Premium", () => {
  test("cor do nome: só Premium, só cores da paleta", () => {
    const base = { displayName: "A", handle: "aaa", bio: "" };
    expect(ops.updateProfile(EMPTY_STATE, { ...base, nameColor: "jade" }).error).toBe("reserved");
    const plus = { ...EMPTY_STATE, profile: { ...EMPTY_PROFILE, role: "plus" as const } };
    expect(ops.updateProfile(plus, { ...base, nameColor: "sakura" }).state.profile.nameColor).toBe("sakura");
    expect(ops.updateProfile(plus, { ...base, nameColor: "neon" as never }).error).toBe("accent");
    expect(rowToProfile({ username: "z", name_color: "neon" }).nameColor).toBeNull();
  });

  test("anúncios só para quem não é Premium", () => {
    expect(showsAds("user")).toBe(true);
    expect(showsAds("plus")).toBe(false);
    expect(showsAds("dev")).toBe(false);
  });

  test("reviews: Premium primeiro, depois as mais novas; vazias saem", () => {
    const row = (id: string, created: string, role: string, review: string | null = "bom") => ({
      id,
      rating_half: 8,
      review,
      watched_on: "2026-11-01",
      created_at: created,
      profiles: { username: id, display_name: id, role },
    });
    const r = rankReviews([
      row("a", "2026-11-05T10:00:00Z", "user"),
      row("b", "2026-11-01T10:00:00Z", "plus"),
      row("c", "2026-11-04T10:00:00Z", "user"),
      row("d", "2026-11-02T10:00:00Z", "dev"),
      row("e", "2026-11-06T10:00:00Z", "user", "   "),
    ]);
    expect(r.map((x) => x.id)).toEqual(["d", "b", "a", "c"]);
    expect(r[0].premium).toBe(true);
    expect(r[2].premium).toBe(false);
  });
});
