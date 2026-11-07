import { describe, expect, test } from "vitest";
import { buildExtraSeasons, seriesTitle } from "./extra-seasons.mjs";

describe("nome da série", () => {
  test("tira marcas de continuação", () => {
    expect(seriesTitle("Ani ni Tsukeru Kusuri wa Nai! 2")).toBe("Ani ni Tsukeru Kusuri wa Nai!");
    expect(seriesTitle("Shingeki no Kyojin Season 3 Part 2")).toBe("Shingeki no Kyojin");
    expect(seriesTitle("Mob Psycho 100 II")).toBe("Mob Psycho 100");
    expect(seriesTitle("Hunter x Hunter (2011)")).toBe("Hunter x Hunter");
    expect(seriesTitle("Steins;Gate")).toBe("Steins;Gate");
  });
});

describe("temporadas que faltam", () => {
  const base = { id: "haikyuu", title: "Haikyuu!!", genres: ["sports"], cover: "/base1.jpg", tmdb: { id: 1, type: "tv", season: 1, offset: 0, count: 25 } };
  const s3 = { id: "haikyuu-3", title: "Haikyuu!! Karasuno", genres: [], cover: null, tmdb: { id: 1, type: "tv", season: 3, offset: 0, count: 10 } };
  const shows = {
    1: {
      seasons: [
        { season_number: 0, episode_count: 5, air_date: "2015-01-01", poster_path: null },
        { season_number: 1, episode_count: 25, air_date: "2014-04-06", poster_path: "/s1abc.jpg" },
        { season_number: 2, episode_count: 25, air_date: "2015-10-04", poster_path: "/s2abc.jpg" },
        { season_number: 3, episode_count: 10, air_date: "2016-10-08", poster_path: "/s3abc.jpg" },
        { season_number: 4, episode_count: 0, air_date: null, poster_path: null },
      ],
    },
  };
  test("cria só a T2 (ignora especiais, existentes e vazias)", () => {
    const extra = buildExtraSeasons([base, s3], shows);
    expect(extra).toHaveLength(1);
    expect(extra[0]).toMatchObject({
      id: "haikyuu-temporada-2",
      title: "Haikyuu!! (Temporada 2)",
      year: 2015,
      episodes: 25,
      cover: "/base1.jpg",
      genres: ["sports"],
      tmdb: { id: 1, type: "tv", season: 2, offset: 0, count: 25 },
      extraSeason: true,
    });
  });
});
