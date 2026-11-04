import { describe, expect, test } from "vitest";
import generated from "./catalog/catalog.generated.json";
import { FEATURED_IDS, rowToAnime, type CatalogRow } from "./catalog/seed";
import { activity, mostWatched, statsByAnime, topRated, trending, trendingAmongFriends } from "./community/aggregate";
import { DEMO_USERS, buildDemoSnapshot } from "./community/demo";
import type { CommunityEvent } from "./community/types";

const ev = (user: string, animeId: string, ratingHalf: number | null, minutesAgo = 10): CommunityEvent => ({
  user,
  animeId,
  ratingHalf,
  review: null,
  minutesAgo,
});

describe("agregações da comunidade", () => {
  test("média, notas e pessoas distintas", () => {
    const s = statsByAnime([ev("a", "x", 10), ev("a", "x", 6), ev("b", "x", null)]).get("x")!;
    expect(s).toMatchObject({ avgHalf: 8, ratings: 2, watchers: 2, recent: 3 });
  });
  test("em alta conta só a última semana", () => {
    const r = trending([ev("a", "velho", 8, 60 * 24 * 10), ev("a", "novo", 8, 5)]);
    expect(r.map((s) => s.animeId)).toEqual(["novo"]);
  });
  test("top exige mínimo de notas", () => {
    const events = [ev("a", "um", 10), ...["a", "b", "c", "d", "e"].map((u) => ev(u, "cinco", 8))];
    expect(topRated(events).map((s) => s.animeId)).toEqual(["cinco"]);
  });
  test("mais vistos = mais pessoas diferentes", () => {
    const events = [ev("a", "x", null), ev("a", "x", null), ev("a", "y", null), ev("b", "y", null)];
    expect(mostWatched(events)[0].animeId).toBe("y");
  });
  test("entre amigos: só quem eu sigo e só nota >= 4", () => {
    const events = [ev("amiga", "bom", 9), ev("amiga", "ruim", 4), ev("estranho", "outro", 10)];
    const r = trendingAmongFriends(events, ["amiga"]);
    expect(r.map((s) => s.animeId)).toEqual(["bom"]);
    expect(r[0].friendsWhoRecommend).toBe(1);
  });
  test("atividade do mais recente ao mais antigo, com listas", () => {
    const items = activity({ demo: false, following: [], episodeEvents: [], events: [ev("a", "x", 8, 30)], lists: [{ id: "l", title: "L", author: "b", animeIds: [], likes: 0, minutesAgo: 5 }] });
    expect(items.map((i) => i.kind)).toEqual(["list", "rated"]);
  });
});

describe("demonstração", () => {
  const catalog = (generated.anime as CatalogRow[]).map(rowToAnime);
  const ids = new Set(catalog.map((a) => a.id));
  const snap = buildDemoSnapshot(catalog, FEATURED_IDS);

  test("é determinística e marcada como demo", () => {
    expect(snap.demo).toBe(true);
    expect(buildDemoSnapshot(catalog, FEATURED_IDS)).toEqual(snap);
  });
  test("só usa animes que existem no catálogo e usuários fictícios", () => {
    for (const e of snap.events) {
      expect(ids.has(e.animeId)).toBe(true);
      expect(DEMO_USERS).toContain(e.user);
      if (e.ratingHalf !== null) expect(e.ratingHalf >= 1 && e.ratingHalf <= 10).toBe(true);
    }
    for (const l of snap.lists) for (const id of l.animeIds) expect(ids.has(id)).toBe(true);
  });
  test("preenche todas as seções", () => {
    expect(trending(snap.events).length).toBeGreaterThan(5);
    expect(trendingAmongFriends(snap.events, snap.following).length).toBeGreaterThan(0);
    expect(topRated(snap.events).length).toBe(10);
    expect(snap.lists.every((l) => l.animeIds.length > 0)).toBe(true);
  });
});
