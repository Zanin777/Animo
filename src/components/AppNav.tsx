"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useAuth } from "@/lib/auth";
import { diary, useDiary } from "@/lib/diary/store";
import { t } from "@/messages";
import { Avatar } from "./Avatar";
import { IconHome, IconLists, IconPlus, IconProfile, IconSearch } from "./Icons";
import { openLog } from "./LogDrawer";
import { ThemeSwitch } from "./ThemeSwitch";

/** O + abre a gaveta; o href continua como reserva (abrir em nova aba, sem JS). */
function onLogClick(e: MouseEvent) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  openLog();
}

// celular: barra inferior com tudo
const ITEMS = [
  { href: "/", label: t.nav.home, Icon: IconHome },
  { href: "/buscar", label: t.nav.search, Icon: IconSearch },
  { href: "/registrar", label: t.nav.log, Icon: IconPlus, primary: true },
  { href: "/listas", label: t.nav.lists, Icon: IconLists },
  { href: "/perfil", label: t.nav.profile, Icon: IconProfile },
] as const;

// computador: busca e perfil têm lugar próprio na barra
const DESKTOP_LINKS = [
  { href: "/", label: t.nav.home, Icon: IconHome },
  { href: "/listas", label: t.nav.lists, Icon: IconLists },
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
  const status = useAuth().status;
  const guest = status === "guest";
  const items = ITEMS.map((it) => (guest && it.href === "/perfil" ? { ...it, href: "/entrar", label: t.nav.signin } : it));
  return (
    <>
      {/* computador: barra de vidro no topo (o conteúdo aparece desfocado por trás ao rolar) */}
      <header className="sticky top-0 z-30 hidden border-b border-line/70 bg-bg/70 backdrop-blur-xl backdrop-saturate-150 md:block">
        <nav className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2.5 min-[1120px]:max-w-[66rem]">
          <Link href="/" className="mr-3 font-display text-[1.7rem] leading-none">
            aniora<span className="text-accent">.</span>
          </Link>
          {DESKTOP_LINKS.map(({ href, label, Icon }) => {
            const active = isActive(path, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${active ? "bg-card font-bold text-fg" : "text-muted hover:bg-card/60 hover:text-fg"}`}
              >
                <Icon size={17} className={active ? "text-active" : undefined} />
                {label}
              </Link>
            );
          })}

          <div className="mx-3 flex-1">{path !== "/buscar" && <NavSearch />}</div>

          <Link
            href="/registrar"
            onClick={onLogClick}
            className="press inline-flex items-center gap-1 rounded-full bg-action py-2 pr-4 pl-3 text-sm font-bold text-on-action shadow-[0_6px_18px_-8px_var(--action)] hover:bg-action-ink"
          >
            <IconPlus size={16} strokeWidth={2.25} />
            {t.nav.log}
          </Link>
          {guest && (
            <Link href="/entrar" className="press rounded-full border border-line px-4 py-2 text-sm font-bold text-fg hover:bg-card">
              {t.nav.signin}
            </Link>
          )}
          {/* enquanto o login carrega, só o lugar do avatar (sem piscar "A" nem "Entrar") */}
          {status === "loading" ? <span className="ml-1 h-9 w-9 rounded-full bg-card" aria-hidden="true" /> : <AccountMenu guest={guest} />}
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

/** Campo de busca da barra: Enter abre /buscar com o texto; "/" em qualquer tela foca o campo. */
function NavSearch() {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (el?.closest("input, textarea, select, [contenteditable=true]")) return;
      e.preventDefault();
      ref.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = ref.current?.value.trim() ?? "";
    router.push(q ? `/buscar?q=${encodeURIComponent(q)}` : "/buscar");
    if (ref.current) ref.current.value = "";
    ref.current?.blur();
  }

  return (
    <form role="search" onSubmit={submit} className="group relative mx-auto max-w-sm">
      <IconSearch size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        placeholder={t.nav.searchPlaceholder}
        aria-label={t.nav.searchPlaceholder}
        className="h-9 w-full rounded-full border border-line bg-card/70 pr-10 pl-10 text-sm text-fg transition-colors outline-none placeholder:text-muted hover:border-fg/25 focus:border-active focus:bg-bg"
      />
      <kbd
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-line px-1.5 font-sans text-[11px] leading-[1.4] text-muted group-focus-within:hidden"
        title={t.nav.searchHint}
      >
        /
      </kbd>
    </form>
  );
}

/** Avatar (ou ícone, para visitante) que abre o menu: perfil, tema e sair. */
function AccountMenu({ guest }: { guest: boolean }) {
  const { profile } = useDiary();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-fg hover:bg-card";
  return (
    <div ref={box} className="relative ml-1">
      <button
        type="button"
        aria-label={t.nav.account}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
        className="press grid h-9 w-9 cursor-pointer place-items-center rounded-full text-muted ring-offset-2 ring-offset-bg transition hover:text-fg focus-visible:ring-2 focus-visible:ring-active"
      >
        {guest ? <IconProfile size={20} /> : <Avatar profile={profile} size={34} />}
      </button>
      {open && (
        <div className="spot-in absolute top-full right-0 mt-2 w-60 rounded-xl border border-line bg-bg/95 p-1.5 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.55)] backdrop-blur-xl">
          {!guest && (
            <div className="border-b border-line px-3 pt-1.5 pb-2.5">
              <p className="truncate font-bold">{profile.displayName || t.nav.profile}</p>
              {profile.handle && <p className="truncate text-xs text-muted">@{profile.handle}</p>}
            </div>
          )}
          <div className="py-1" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
            {guest ? (
              <>
                <Link href="/entrar" className={item}>
                  {t.nav.signin}
                </Link>
                <Link href="/cadastro" className={item}>
                  {t.nav.signup}
                </Link>
              </>
            ) : (
              <>
                <Link href="/perfil" className={item}>
                  {t.nav.profile}
                </Link>
                <Link href="/listas" className={item}>
                  {t.nav.lists}
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-line px-3 pt-2.5 pb-1.5 text-sm text-muted">
            {t.profile.theme}
            <ThemeSwitch />
          </div>
          {!guest && (
            <button
              type="button"
              className={`${item} mt-1 border-t border-line text-muted`}
              onClick={() => {
                setOpen(false);
                void diary.signOut();
              }}
            >
              {t.auth.signout}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
