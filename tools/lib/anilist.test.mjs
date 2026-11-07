import { describe, expect, test } from "vitest";
import { anilistId, coverPath } from "./anilist.mjs";

describe("anilist", () => {
  test("acha o id do AniList nas sources", () => {
    expect(anilistId(["https://myanimelist.net/anime/21", "https://anilist.co/anime/21"])).toBe(21);
    expect(anilistId(["https://anilist.co/anime/21/x", "https://evil.co/anime/1"])).toBeNull();
  });
  test("só aceita capa extraLarge do CDN do AniList", () => {
    expect(coverPath("https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg")).toBe("/bx21-ELSYx3yMPcKM.jpg");
    expect(coverPath("https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21-ELSYx3yMPcKM.jpg")).toBeNull();
    expect(coverPath("https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/../x.jpg")).toBeNull();
    expect(coverPath(null)).toBeNull();
  });
});
