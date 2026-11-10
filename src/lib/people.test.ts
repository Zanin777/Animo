import { describe, expect, test } from "vitest";
import { handleQuery, likeLiteral } from "./social/people";

describe("buscar pessoas", () => {
  test("@ vira só o que pode existir num usuário", () => {
    expect(handleQuery("@Zanin7")).toBe("zanin7");
    expect(handleQuery("  @@zanin_7!  ")).toBe("zanin_7");
    expect(handleQuery("@a,b(c)")).toBe("abc");
    expect(handleQuery("@" + "x".repeat(40))).toHaveLength(20);
  });
  test("curingas do banco viram texto comum", () => {
    expect(likeLiteral("100%")).toBe("100\\%");
    expect(likeLiteral("a_b")).toBe("a\\_b");
    expect(likeLiteral("c:\\x")).toBe("c:\\\\x");
    expect(likeLiteral("Matheus")).toBe("Matheus");
  });
});
