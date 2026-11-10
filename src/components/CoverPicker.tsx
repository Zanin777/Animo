"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Anime } from "@/lib/catalog/provider";
import { useCoverChoices } from "@/lib/covers/choices";
import { TMDB_POSTER_BASE, TMDB_POSTER_PATH, type CoversResponse } from "@/lib/covers/types";
import { t } from "@/messages";
import { Poster } from "./Poster";
import { Muted } from "./ui";

// 1ª linha e meia: a oficial + 11 (o resto em "Ver mais")
const SHOWN = 11;

/**
 * Premium escolhe outra capa oficial (TMDB) para este anime/temporada.
 * A escolha vale só no perfil da pessoa; aqui na página o anime segue com a capa oficial.
 */
export function CoverPicker({ anime, userId, label }: { anime: Anime; userId: string; label: string }) {
  const { covers, setCover } = useCoverChoices(userId);
  const [list, setList] = useState<{ id: string; posters: string[] | null }>({ id: "", posters: null });
  const [msg, setMsg] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const current = covers[anime.id] ?? null;

  useEffect(() => {
    let alive = true;
    fetch(`/api/covers/${encodeURIComponent(anime.id)}`)
      .then((r) => (r.ok ? (r.json() as Promise<CoversResponse>) : null))
      .then((d) => alive && setList({ id: anime.id, posters: (d?.posters ?? []).filter((p) => TMDB_POSTER_PATH.test(p)) }))
      .catch(() => alive && setList({ id: anime.id, posters: [] }));
    return () => {
      alive = false;
    };
  }, [anime.id]);

  const posters = list.id === anime.id ? list.posters : null;

  async function pick(path: string | null) {
    if (path === current) return;
    setMsg(null);
    const ok = await setCover(anime.id, path);
    setMsg(ok ? t.covers.saved : t.covers.error);
  }

  const tile = (on: boolean) =>
    `press relative block cursor-pointer rounded-lg transition-[box-shadow,opacity] ${
      on ? "shadow-[0_0_0_2px_var(--bg),0_0_0_4px_var(--active)]" : "opacity-80 hover:opacity-100"
    }`;

  return (
    <section className="rise mt-6 rounded-xl bg-card p-4" aria-label={t.covers.title}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-bold">
          {t.covers.title} <span className="font-normal text-muted">· {label}</span>
        </h2>
        <p className="text-xs text-muted" aria-live="polite">
          {msg ?? t.covers.hint}
        </p>
      </div>

      {posters === null ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="aspect-[2/3] rounded-lg bg-bg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6" role="radiogroup" aria-label={t.covers.title}>
          <button type="button" role="radio" aria-checked={current === null} onClick={() => pick(null)} className={tile(current === null)}>
            <Poster anime={{ ...anime, id: undefined }} />
            <span className="absolute bottom-1.5 left-1/2 z-[3] -translate-x-1/2 rounded-full bg-bg/85 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap">
              {t.covers.official}
            </span>
          </button>
          {(all ? posters : posters.slice(0, SHOWN)).map((p, i) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={current === p}
              aria-label={t.covers.option(i + 1)}
              onClick={() => pick(p)}
              className={tile(current === p)}
            >
              <span className="relative block aspect-[2/3] overflow-hidden rounded-lg bg-bg">
                <Image src={`${TMDB_POSTER_BASE}${p}`} alt="" fill sizes="120px" className="object-cover" />
              </span>
            </button>
          ))}
        </div>
      )}
      {posters !== null && posters.length > SHOWN && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-3 cursor-pointer text-sm font-bold underline decoration-link-line underline-offset-4 hover:decoration-fg"
        >
          {all ? t.covers.less : t.covers.more(posters.length - SHOWN)}
        </button>
      )}
      {posters !== null && posters.length === 0 && <Muted className="mt-3 text-sm">{t.covers.none}</Muted>}
    </section>
  );
}
