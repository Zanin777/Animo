import { describe, expect, test } from "vitest";
import { assignOffsets, chooseSeason } from "./season-pick.mjs";

const S = (season_number, year, episode_count) => ({ season_number, air_date: `${year}-04-01`, episode_count, poster_path: null });

describe("escolha de temporada do TMDB", () => {
  const aot = [S(0, 2013, 10), S(1, 2013, 25), S(2, 2017, 12), S(3, 2018, 22), S(4, 2020, 28)];
  test("mesmo ano, ignora especiais", () => {
    expect(chooseSeason({ title: "Shingeki no Kyojin", year: 2013, episodes: 25 }, aot).season).toBe(1);
    expect(chooseSeason({ title: "Shingeki no Kyojin Season 2", year: 2017, episodes: 12 }, aot).season).toBe(2);
  });
  test("sem ano igual, usa o mais próximo", () => {
    expect(chooseSeason({ title: "Shingeki no Kyojin Season 3 Part 2", year: 2019, episodes: 10 }, aot).season).toBe(3);
    expect(chooseSeason({ title: "Shingeki no Kyojin: The Final Season", year: 2021, episodes: 16 }, aot).season).toBe(4);
  });
  test("sem temporadas válidas", () => {
    expect(chooseSeason({ title: "X", year: 2020, episodes: 1 }, [S(0, 2020, 3)])).toBeNull();
  });
});

describe("divisão de episódios na mesma temporada", () => {
  test("em ordem de lançamento", () => {
    const e = (id, year, title, count, total) => ({ id, year, title, tmdbId: 1, pick: { season: 1, total, count, offset: 0 } });
    const list = [e("jjk2", 2023, "Jujutsu Kaisen 2nd Season", 23, 59), e("jjk1", 2020, "Jujutsu Kaisen", 24, 59), e("jjk3", 2026, "Jujutsu Kaisen: Shimetsu", 12, 59)];
    assignOffsets(list);
    expect(Object.fromEntries(list.map((x) => [x.id, x.pick.offset]))).toEqual({ jjk1: 0, jjk2: 24, jjk3: 47 });
  });
  test("se não couber, fica no fim da temporada", () => {
    const p = { season: 3, total: 22, count: 15, offset: 0 };
    const q = { season: 3, total: 22, count: 15, offset: 0 };
    assignOffsets([{ id: "a", year: 2018, title: "A", tmdbId: 9, pick: p }, { id: "b", year: 2019, title: "B", tmdbId: 9, pick: q }]);
    expect([p.offset, q.offset]).toEqual([0, 7]);
  });
});
