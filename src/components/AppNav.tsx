"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/messages";

const ITEMS = [
  { href: "/", label: t.nav.home, icon: "⌂" },
  { href: "/buscar", label: t.nav.search, icon: "⌕" },
  { href: "/registrar", label: t.nav.log, icon: "+", primary: true },
  { href: "/listas", label: t.nav.lists, icon: "☰" },
  { href: "/perfil", label: t.nav.profile, icon: "◯" },
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
  return (
    <>
      {/* desktop: navbar no topo */}
      <header className="sticky top-0 z-20 hidden border-b border-line bg-bg/90 backdrop-blur md:block">
        <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3">
          <Link href="/" className="mr-auto font-display text-2xl leading-none">
            cour<span className="text-accent">.</span>
          </Link>
          {ITEMS.map((it) =>
            "primary" in it ? (
              <Link
                key={it.href}
                href={it.href}
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-white hover:bg-accent-ink"
              >
                {it.label}
              </Link>
            ) : (
              <Link
                key={it.href}
                href={it.href}
                aria-current={isActive(path, it.href) ? "page" : undefined}
                className={`text-sm ${isActive(path, it.href) ? "font-bold text-accent" : "text-muted hover:text-fg"}`}
              >
                {it.label}
              </Link>
            ),
          )}
        </nav>
      </header>

      {/* celular: barra inferior */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-card pt-2 text-xs md:hidden"
        style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}
      >
        {ITEMS.map((it) => {
          const active = isActive(path, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`grid justify-items-center gap-0.5 ${active ? "font-bold text-accent" : "text-muted"}`}
            >
              {"primary" in it ? (
                <i className="-mt-3.5 grid h-[34px] w-[34px] place-items-center rounded-full bg-accent text-lg not-italic text-white">
                  {it.icon}
                </i>
              ) : (
                <i className="text-lg leading-6 not-italic">{it.icon}</i>
              )}
              {it.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
