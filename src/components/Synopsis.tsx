"use client";

import { useEffect, useRef, useState } from "react";
import type { Anime } from "@/lib/catalog/provider";
import type { SynopsisResponse } from "@/lib/synopsis/clean";
import { t } from "@/messages";

const NONE: SynopsisResponse = { animeId: "", text: null, lang: null, source: null };
const cache = new Map<string, SynopsisResponse>();

// animes criados pelo usuário não estão no servidor: sem sinopse
const isLocal = (a: Pick<Anime, "id">) => a.id.startsWith("u-");

function useSynopsis(anime: Pick<Anime, "id">): SynopsisResponse | null {
  const [data, setData] = useState<SynopsisResponse | null>(() => cache.get(anime.id) ?? null);
  useEffect(() => {
    if (isLocal(anime) || cache.has(anime.id)) return;
    let alive = true;
    fetch(`/api/synopsis/${encodeURIComponent(anime.id)}`)
      .then((r) => (r.ok ? (r.json() as Promise<SynopsisResponse>) : null))
      .then((d) => {
        // só guarda o que tem texto: sem texto pode ter sido falha passageira da fonte
        if (d?.text) cache.set(anime.id, d);
        if (alive) setData(d ?? NONE);
      })
      .catch(() => alive && setData(NONE));
    return () => {
      alive = false;
    };
  }, [anime]);
  return isLocal(anime) ? NONE : data;
}

/** Só o começo da sinopse, em poucas linhas e sem botões (ex.: anime em destaque do perfil). */
export function SynopsisSnippet({ anime, className = "" }: { anime: Pick<Anime, "id">; className?: string }) {
  const data = useSynopsis(anime);
  if (!data?.text) return null;
  return (
    <span lang={data.lang ?? undefined} className={`line-clamp-2 ${className}`}>
      {data.text}
    </span>
  );
}

/**
 * Sinopse curta do anime. Vem do servidor como TEXTO PURO e é mostrada como
 * texto (nada de HTML). Longa demais: fica em poucas linhas, com "Ler mais".
 */
export function Synopsis({ anime, className = "" }: { anime: Pick<Anime, "id">; className?: string }) {
  const data = useSynopsis(anime);
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // o texto passa das linhas visíveis? (muda com a largura da tela)
  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data, open]);

  if (data === null) {
    // enquanto carrega, guarda o lugar para a página não pular
    return (
      <div className={`grid content-start gap-2 ${className}`} role="status" aria-label={t.anime.synopsisLoading}>
        <span className="h-3 w-full rounded-sm bg-card" />
        <span className="h-3 w-11/12 rounded-sm bg-card" />
        <span className="h-3 w-3/4 rounded-sm bg-card" />
      </div>
    );
  }
  if (!data.text) return null;

  return (
    <div className={className}>
      <p
        ref={ref}
        lang={data.lang ?? undefined}
        className={`max-w-[65ch] text-[15px] leading-relaxed ${open ? "" : "line-clamp-5 sm:line-clamp-4"}`}
      >
        {data.text}
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {(clamped || open) && (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="cursor-pointer font-bold text-fg underline decoration-link-line underline-offset-4 hover:decoration-fg"
          >
            {open ? t.anime.synopsisLess : t.anime.synopsisMore}
          </button>
        )}
        <span>{data.source === "tmdb" ? t.anime.synopsisTmdb : t.anime.synopsisAnilist}</span>
      </p>
    </div>
  );
}
