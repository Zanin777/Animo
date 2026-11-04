import { describe, expect, test } from "vitest";
import { normalize, rankMatches } from "./catalog/provider";
import generated from "./catalog/catalog.generated.json";
import { rowToAnime, type CatalogRow } from "./catalog/seed";

const SEED_ANIME = (generated.anime as CatalogRow[]).map(rowToAnime);
import * as ops from "./diary/ops";
import { computeStats } from "./diary/stats";
import { EMPTY_STATE, type DiaryState } from "./diary/types";
import { POSTER_PALETTES, hashTitle, posterStyle } from "./poster";
import { formatRating, halfToStars, starsToHalf } from "./rating";

let n = 0;
const ctx: ops.Ctx = { now: "2026-11-04T12:00:00.000Z", newId: () => `id${++n}` };
const frieren = SEED_ANIME.find((a) => a.id === "frieren")!;

describe("nota", () => {
  test("converte meias estrelas", () => {
    expect(halfToStars(9)).toBe(4.5);
    expect(starsToHalf(0.5)).toBe(1);
    expect(starsToHalf(5)).toBe(10);
    expect(() => starsToHalf(0)).toThrow(RangeError);
    expect(() => starsToHalf(5.5)).toThrow(RangeError);
  });
  test("formata em pt-BR", () => {
    expect(formatRating(9)).toBe("4,5");
    expect(formatRating(10)).toBe("5");
    expect(formatRating(1)).toBe("0,5");
  });
});

describe("pôster", () => {
  test("mesmo título, mesmo pôster", () => {
    expect(posterStyle("Cowboy Bebop")).toEqual(posterStyle("Cowboy Bebop"));
  });
  test("hash igual ao da página de estilo (FNV-1a)", () => {
    expect(hashTitle("")).toBe(2166136261);
    expect(hashTitle("a")).toBe(0xe40c292c);
  });
  test("paleta sempre válida", () => {
    for (const a of SEED_ANIME) expect(POSTER_PALETTES).toContain(posterStyle(a.title).palette);
  });
});

describe("busca", () => {
  test("ignora acento, caixa e pontuação", () => {
    expect(normalize("Ataque dos Titãs!")).toBe("ataque dos titas");
  });
  test("acha por nome alternativo", () => {
    expect(rankMatches(SEED_ANIME, "attack on titan")[0].id).toBe("shingeki-no-kyojin");
    expect(rankMatches(SEED_ANIME, "titãs")[0].id).toBe("shingeki-no-kyojin");
  });
  test("exato > começa com > contém", () => {
    const mk = (id: string, title: string) => ({ ...frieren, id, title, aliases: [] });
    const list = [mk("c", "Princesa Mononoke"), mk("b", "Mononoke Hime"), mk("a", "Mononoke")];
    expect(rankMatches(list, "mononoke").map((a) => a.id)).toEqual(["a", "b", "c"]);
  });
  test("busca vazia não retorna nada", () => {
    expect(rankMatches(SEED_ANIME, "   ")).toEqual([]);
  });
});

describe("catálogo importado", () => {
  const UNSAFE = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/;
  test("tem os curados com id fixo", () => {
    for (const id of ["frieren", "shingeki-no-kyojin", "perfect-blue", "oshi-no-ko", "one-piece"]) {
      expect(SEED_ANIME.find((a) => a.id === id), id).toBeDefined();
    }
  });
  test("ids únicos e tudo dentro dos limites do schema", () => {
    expect(new Set(SEED_ANIME.map((a) => a.id)).size).toBe(SEED_ANIME.length);
    for (const a of SEED_ANIME) {
      expect(a.title.length).toBeLessThanOrEqual(200);
      expect(UNSAFE.test(a.title)).toBe(false);
      for (const s of a.aliases) expect(s.length <= 100 && !UNSAFE.test(s)).toBe(true);
      if (a.year !== null) expect(a.year).toBeGreaterThanOrEqual(1910);
      if (a.episodes !== null) expect(a.episodes).toBeGreaterThanOrEqual(1);
    }
  });
  test("nada de URL de terceiros; capa é só caminho do TMDB", () => {
    expect(JSON.stringify(SEED_ANIME)).not.toMatch(/https?:\/\//);
    for (const a of SEED_ANIME) if (a.cover !== null) expect(a.cover).toMatch(/^\/[A-Za-z0-9_-]{5,64}\.(jpg|png)$/);
  });
  test("tem 2.000 animes", () => {
    expect(SEED_ANIME.length).toBe(2000);
  });
});

describe("diário", () => {
  test("registrar marca como Visto com todos os episódios", () => {
    const s = ops.addEntry(EMPTY_STATE, { animeId: "frieren", ratingHalf: 9, watchedOn: "2026-11-02" }, frieren, ctx);
    expect(s.entries).toHaveLength(1);
    expect(s.entries[0].review).toBeNull();
    expect(s.library.frieren).toMatchObject({ status: "watched", episodesWatched: 28 });
  });
  test("nota fora de 1..10 é recusada", () => {
    expect(() => ops.addEntry(EMPTY_STATE, { animeId: "x", ratingHalf: 11, watchedOn: "2026-01-01" }, null, ctx)).toThrow();
    expect(() => ops.addEntry(EMPTY_STATE, { animeId: "x", ratingHalf: 4.5, watchedOn: "2026-01-01" }, null, ctx)).toThrow();
  });
  test("+1 episódio até o fim vira Visto e para", () => {
    const short = { ...frieren, id: "s", episodes: 2 };
    let s = ops.plusOneEpisode(EMPTY_STATE, short, ctx);
    expect(s.library.s).toMatchObject({ status: "watching", episodesWatched: 1 });
    s = ops.plusOneEpisode(s, short, ctx);
    expect(s.library.s).toMatchObject({ status: "watched", episodesWatched: 2 });
    expect(ops.plusOneEpisode(s, short, ctx)).toBe(s);
  });
  test("no máximo 4 favoritos", () => {
    let s: DiaryState = EMPTY_STATE;
    for (const id of ["a", "b", "c", "d"]) s = ops.toggleFavorite(s, id).state;
    const r = ops.toggleFavorite(s, "e");
    expect(r.ok).toBe(false);
    expect(r.state.favorites).toEqual(["a", "b", "c", "d"]);
    expect(ops.toggleFavorite(s, "b").state.favorites).toEqual(["a", "c", "d"]);
  });
  test("lista não repete anime e renumera ao tirar", () => {
    const { state, id } = ops.createList(EMPTY_STATE, { title: "Top", isRanked: true }, ctx);
    let s = ops.addToList(state, id, "a", ctx).state;
    s = ops.addToList(s, id, "b", ctx).state;
    expect(ops.addToList(s, id, "a", ctx).added).toBe(false);
    s = ops.removeFromList(s, id, "a", ctx);
    expect(s.lists[0].items).toEqual([{ animeId: "b", position: 1 }]);
  });
  test("tirar da biblioteca", () => {
    const s = ops.setStatus(EMPTY_STATE, "a", "want", ctx);
    expect(ops.setStatus(s, "a", null, ctx).library).toEqual({});
  });
});

describe("estatísticas", () => {
  test("conta registros, ano e média", () => {
    let s = ops.addEntry(EMPTY_STATE, { animeId: "frieren", ratingHalf: 10, watchedOn: "2026-03-01" }, frieren, ctx);
    s = ops.addEntry(s, { animeId: "frieren", ratingHalf: 8, watchedOn: "2025-12-31", isRewatch: true }, frieren, ctx);
    s = ops.addEntry(s, { animeId: "x", ratingHalf: null, watchedOn: "2026-05-01" }, null, ctx);
    const st = computeStats(s, 2026);
    expect(st).toMatchObject({ entries: 3, thisYear: 2, avgHalf: 9, watched: 2 });
    expect(st.distribution[9]).toBe(1);
    expect(st.distribution[7]).toBe(1);
  });
});
