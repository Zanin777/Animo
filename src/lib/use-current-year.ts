"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Ano atual só no navegador; no prerender é null (Next não deixa ler a hora lá). */
export function useCurrentYear(): number | null {
  return useSyncExternalStore(noop, () => new Date().getFullYear(), () => null);
}
