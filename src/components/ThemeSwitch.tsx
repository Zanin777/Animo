"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "@/lib/theme";
import { t } from "@/messages";

type Theme = "light" | "dark" | "system";

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const read = (): Theme => {
  const v = document.documentElement.dataset.theme;
  return v === "light" || v === "dark" ? v : "system";
};

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {}
  listeners.forEach((l) => l());
}

export function ThemeSwitch() {
  const theme = useSyncExternalStore(subscribe, read, () => "system" as Theme);

  const options: [Theme, string][] = [
    ["light", t.profile.themeLight],
    ["dark", t.profile.themeDark],
    ["system", t.profile.themeSystem],
  ];

  return (
    <div className="flex rounded-full border border-line p-0.5 text-xs" role="radiogroup" aria-label={t.profile.theme}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={theme === v}
          onClick={() => apply(v)}
          className={`cursor-pointer rounded-full px-2.5 py-1 ${theme === v ? "bg-fg text-bg" : "text-muted"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
