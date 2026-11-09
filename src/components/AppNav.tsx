"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useAuth } from "@/lib/auth";
import { t } from "@/messages";
import { IconHome, IconLists, IconPlus, IconProfile, IconSearch } from "./Icons";
import { openLog } from "./LogDrawer";
import { ThemeSwitch } from "./ThemeSwitch";

/** O + abre a gaveta; o href continua como reserva (abrir em nova aba, sem JS). */
function onLogClick(e: MouseEvent) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  openLog();
}

const ITEMS = [
  { href: "/", label: t.nav.home, Icon: IconHome },
  { href: "/buscar", label: t.nav.search, Icon: IconSearch },
  { href: "/registrar", label: t.nav.log, Icon: IconPlus, primary: true },
  { href: "/listas", label: t.nav.lists, Icon: IconLists },
  { href: "/perfil", label: t.nav.profile, Icon: IconProfile },
] as const;

function isActive(path: string | null, href: string) {
  if (path === null) return false;
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

/** Com a rota atual (precisa de <Suspense>: a URL só existe em runtime). */
export function AppNav() {
  return <NavShell path={usePathname()} />;
}

/** Mesma navegação sem item ativo: fallback do Suspense no prerender. */
export function NavShell({ path }: { path: string | null }) {
  // visitante: "Perfil" vira o botão "Entrar"
  const guest = useAuth().status === "guest";
  const items = ITEMS.map((it) => (guest && it.href === "/perfil" ? { ...it, href: "/entrar", label: t.nav.signin } : it));
  return (
    <>
      {/* desktop: navbar no topo */}
      <header className="sticky top-0 z-20 hidden border-b border-line bg-bg md:block">
        <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3 min-[1120px]:max-w-[66rem]">
          <Link href="/" className="mr-auto font-display text-2xl leading-none">
            aniora<span className="text-accent">.</span>
          </Link>
          {items.map((it) =>
            "primary" in it ? (
              <Link
                key={it.href}
                href={it.href}
                onClick={onLogClick}
                className="press inline-flex items-center gap-1 rounded-md bg-action py-1.5 pr-3.5 pl-2.5 text-sm font-bold text-on-action hover:bg-action-ink"
              >
                <it.Icon size={16} strokeWidth={2.25} />
                {it.label}
              </Link>
            ) : (
              <Link
                key={it.href}
                href={it.href}
                aria-current={isActive(path, it.href) ? "page" : undefined}

                className={
                  it.href === "/entrar"
                    ? "press rounded-md border border-line px-3 py-1.5 text-sm font-bold text-fg hover:bg-card"
                    : `text-sm underline-offset-[6px] transition-colors ${isActive(path, it.href) ? "text-fg underline decoration-active decoration-2" : "text-muted hover:text-fg"}`
                }

              >
                {it.label}
              </Link>
            ),
          )}
          <span className="-mx-2 h-5 w-px bg-line" aria-hidden="true" />
          <ThemeSwitch />
        </nav>
      </header>

      {/* celular: barra inferior */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-bg pt-1.5 text-[11px] md:hidden"
        style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}
      >
        {items.map((it) => {
          const active = isActive(path, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={"primary" in it ? onLogClick : undefined}
              aria-current={active ? "page" : undefined}
              className={`press grid min-w-14 justify-items-center gap-0.5 ${active ? "font-bold text-fg" : "text-muted"}`}
            >
              {"primary" in it ? (
                <span className="grid h-[30px] w-[42px] place-items-center rounded-md bg-action text-on-action">
                  <it.Icon size={20} strokeWidth={2.25} />
                </span>
              ) : (
                <span className="relative grid h-[30px] place-items-center">
                  <it.Icon size={22} className={active ? "text-active" : undefined} />
                </span>
              )}
              {it.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
