import { describe, expect, test } from "vitest";
import generated from "./catalog/catalog.generated.json";
import type { Anime } from "./catalog/provider";
import { rowToAnime, type CatalogRow } from "./catalog/seed";
import { seasonsOf } from "./catalog/seasons";

const catalog = (generated.anime as CatalogRow[]).map(rowToAnime);
const get = (id: string) => catalog.find((a) => a.id === id)!;

describe("temporadas de uma série", () => {
  test("Shingeki: todas as temporadas em ordem, com partes", () => {
    const tabs = seasonsOf(get("shingeki-no-kyojin"), catalog);
    const labels = tabs.map((s) => (s.part ? `${s.season}.${s.part}` : `${s.season}`));
    expect(labels.slice(0, 6)).toEqual(["1", "2", "3.1", "3.2", "4.1", "4.2"]);
  });
  test("a lista é a mesma vista de qualquer temporada", () => {
    const fromS1 = seasonsOf(get("shingeki-no-kyojin"), catalog).map((s) => s.anime.id);
    const fromS2 = seasonsOf(get(fromS1[1]), catalog).map((s) => s.anime.id);
    expect(fromS2).toEqual(fromS1);
  });
  test("temporadas que faltavam agora existem (Haikyuu T2)", () => {
    const seasons = seasonsOf(get("haikyuu"), catalog).map((s) => s.season);
    expect(seasons).toContain(2);
  });
  test("filme ou série de uma temporada: sem abas", () => {
    expect(seasonsOf(get("kimi-no-na-wa"), catalog)).toEqual([]);
    const solo: Anime = { ...get("cowboy-bebop"), tmdb: { id: 999999999, type: "tv", season: 1, offset: 0, count: 26 } };
    expect(seasonsOf(solo, [solo])).toEqual([]);
  });
  test("ids do catálogo continuam únicos e válidos", () => {
    const ids = catalog.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((i) => /^[a-z0-9-]{1,80}$/.test(i))).toBe(true);
  });
});
