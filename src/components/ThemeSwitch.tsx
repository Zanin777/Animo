"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "@/lib/theme";
import { t } from "@/messages";
import { IconMonitor, IconMoon, IconSun } from "./Icons";

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

const OPTIONS = [
  ["light", t.profile.themeLight, IconSun],
  ["dark", t.profile.themeDark, IconMoon],
  ["system", t.profile.themeSystem, IconMonitor],
] as const;

/** Claro / Escuro / Sistema em três ícones (fica na barra do topo). */
export function ThemeSwitch() {
  const theme = useSyncExternalStore(subscribe, read, () => "system" as Theme);
  return (
    <div className="inline-flex rounded-md bg-card p-0.5" role="radiogroup" aria-label={t.profile.theme}>
      {OPTIONS.map(([v, label, Icon]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={theme === v}
          aria-label={label}
          title={label}
          onClick={() => apply(v)}
          className={`press grid h-7 w-7 cursor-pointer place-items-center rounded-[5px] transition-colors ${theme === v ? "bg-bg text-fg shadow-[0_1px_2px_rgb(0_0_0/0.18)]" : "text-muted hover:text-fg"}`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
