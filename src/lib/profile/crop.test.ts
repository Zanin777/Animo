import { describe, expect, test } from "vitest";
import { cropRect } from "./crop";

describe("cropRect", () => {
  test("zoom 1 no centro = maior recorte centralizado", () => {
    expect(cropRect(1000, 500, 1, 1, 500, 250)).toEqual({ sx: 250, sy: 0, sw: 500, sh: 500 });
    expect(cropRect(1000, 1000, 3.2, 1, 500, 500)).toEqual({ sx: 0, sy: 343.75, sw: 1000, sh: 312.5 });
  });
  test("zoom diminui o recorte e o centro fica dentro da imagem", () => {
    expect(cropRect(1000, 500, 1, 2, 0, 0)).toEqual({ sx: 0, sy: 0, sw: 250, sh: 250 });
    expect(cropRect(1000, 500, 1, 2, 9999, 9999)).toEqual({ sx: 750, sy: 250, sw: 250, sh: 250 });
  });
  test("zoom fora do intervalo é limitado", () => {
    expect(cropRect(100, 100, 1, 0.1, 50, 50).sw).toBe(100);
  });
});
