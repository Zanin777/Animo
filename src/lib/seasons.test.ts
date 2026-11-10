import { describe, expect, test } from "vitest";
import generated from "./catalog/catalog.generated.json";
import type { Anime } from "./catalog/provider";
import { rowToAnime, type CatalogRow } from "./catalog/seed";
import { rankMatches } from "./catalog/provider";
import { collapseToSeries, seasonsOf, seriesIndex } from "./catalog/seasons";

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

describe("séries: um anime só para as temporadas", () => {
  const index = seriesIndex(catalog);
  const byId = new Map(catalog.map((a) => [a.id, a]));
  const lookup = (id: string) => byId.get(id) ?? null;

  test("qualquer temporada aponta para a 1ª", () => {
    expect(index.headOf("shingeki-no-kyojin-season-3")).toBe("shingeki-no-kyojin");
    expect(index.headOf("shingeki-no-kyojin")).toBe("shingeki-no-kyojin");
    expect(index.seasonsOf("shingeki-no-kyojin-season-2").map((s) => s.anime.id)[0]).toBe("shingeki-no-kyojin");
  });
  test("anime sozinho e filme ficam como estão", () => {
    expect(index.headOf("kimi-no-na-wa")).toBe("kimi-no-na-wa");
    expect(index.seasonsOf("kimi-no-na-wa")).toEqual([]);
  });
  test("busca mostra a série uma vez, pela 1ª temporada", () => {
    const ids = collapseToSeries(rankMatches(catalog, "shingeki no kyojin", 60), index, lookup).map((a) => a.id);
    expect(ids).toContain("shingeki-no-kyojin");
    expect(ids.filter((id) => index.headOf(id) === "shingeki-no-kyojin")).toHaveLength(1);
    // buscando pelo nome da T3, aparece a série
    expect(collapseToSeries(rankMatches(catalog, "shingeki no kyojin season 3", 20), index, lookup)[0].id).toBe("shingeki-no-kyojin");
  });
});

