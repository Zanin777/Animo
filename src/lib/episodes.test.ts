import { describe, expect, test } from "vitest";
import { mostWatchedEpisodes, topEpisodes } from "./community/aggregate";
import type { EpisodeEvent } from "./community/types";
import * as ops from "./diary/ops";
import { EMPTY_STATE } from "./diary/types";
import { STILL_PATH, numberedEpisodes } from "./episodes/types";

describe("nota por episódio", () => {
  test("dá, troca e tira nota", () => {
    let s = ops.rateEpisode(EMPTY_STATE, "x", 3, 8);
    s = ops.rateEpisode(s, "x", 5, 10);
    expect(s.episodeRatings.x).toEqual({ 3: 8, 5: 10 });
    s = ops.rateEpisode(s, "x", 3, null);
    expect(s.episodeRatings.x).toEqual({ 5: 10 });
    s = ops.rateEpisode(s, "x", 5, null);
    expect(s.episodeRatings).toEqual({});
  });
  test("recusa episódio ou nota inválidos", () => {
    expect(() => ops.rateEpisode(EMPTY_STATE, "x", 0, 8)).toThrow();
    expect(() => ops.rateEpisode(EMPTY_STATE, "x", 2, 11)).toThrow();
    expect(() => ops.rateEpisode(EMPTY_STATE, "x", 1.5, 8)).toThrow();
  });
});

describe("perfil local", () => {
  test("normaliza usuário e salva", () => {
    const r = ops.updateProfile(EMPTY_STATE, { displayName: " Matheus ", handle: "@Matheus_Z", bio: "oi" });
    expect(r.error).toBeNull();
    expect(r.state.profile).toMatchObject({ displayName: "Matheus", handle: "matheus_z", bio: "oi" });
  });
  test("mesmas regras do banco", () => {
    expect(ops.updateProfile(EMPTY_STATE, { displayName: "", handle: "ab", bio: "" }).error).toBe("handle");
    expect(ops.updateProfile(EMPTY_STATE, { displayName: "", handle: "com espaço", bio: "" }).error).toBe("handle");
    expect(ops.updateProfile(EMPTY_STATE, { displayName: "x".repeat(51), handle: "", bio: "" }).error).toBe("displayName");
    expect(ops.updateProfile(EMPTY_STATE, { displayName: "", handle: "", bio: "x".repeat(301) }).error).toBe("bio");
  });
});

describe("episódios", () => {
  test("numeração de reserva", () => {
    expect(numberedEpisodes(3).map((e) => e.number)).toEqual([1, 2, 3]);
    expect(numberedEpisodes(-1)).toEqual([]);
  });
  test("só aceita caminho de imagem do TMDB", () => {
    expect(STILL_PATH.test("/abc123XYZ.jpg")).toBe(true);
    expect(STILL_PATH.test("https://evil.com/x.jpg")).toBe(false);
    expect(STILL_PATH.test("/../../x.jpg")).toBe(false);
    expect(STILL_PATH.test("/abc.svg")).toBe(false);
  });
});

describe("rankings de episódio", () => {
  const ev = (user: string, episode: number, ratingHalf: number | null): EpisodeEvent => ({ user, animeId: "a", episode, ratingHalf });
  test("top exige 3 notas", () => {
    const events = [ev("u1", 1, 10), ...["u1", "u2", "u3"].map((u) => ev(u, 2, 8))];
    expect(topEpisodes(events).map((s) => s.episode)).toEqual([2]);
  });
  test("mais vistos conta pessoas diferentes", () => {
    const events = [ev("u1", 1, null), ev("u2", 1, null), ev("u1", 2, null), ev("u1", 2, 9)];
    expect(mostWatchedEpisodes(events).map((s) => [s.episode, s.watchers])).toEqual([
      [1, 2],
      [2, 1],
    ]);
  });
});
