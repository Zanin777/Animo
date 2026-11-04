import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { SlidingNumber } from "./SlidingNumber";

beforeAll(() => {
  // jsdom não tem ResizeObserver (usado pelo react-use-measure)
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);

describe("SlidingNumber", () => {
  test("leitor de tela ouve só o número, com vírgula", () => {
    const { container } = render(<SlidingNumber value={4.25} decimals={1} />);
    expect(container.querySelector(".sr-only")?.textContent).toBe("4,3");
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });
  test("inteiro sem casas decimais", () => {
    const { container } = render(<SlidingNumber value={128} />);
    expect(container.querySelector(".sr-only")?.textContent).toBe("128");
  });
});
