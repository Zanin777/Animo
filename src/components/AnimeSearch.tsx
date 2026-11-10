"use client";

import { useEffect, useState } from "react";
import type { Anime, AnimeKind } from "@/lib/catalog/provider";
import { useCatalog } from "@/lib/catalog/local";
import { t } from "@/messages";
import { IconSearch } from "./Icons";
import { btnGhost, btnPrimary, card, input } from "./ui";

type Props = {
  onPick: (anime: Anime) => void;
  autoFocus?: boolean;
  /** como mostrar os resultados */
  render: (results: Anime[]) => React.ReactNode;
  /** avisa quais animes estão nos resultados (vazio quando não há busca) */
  onResults?: (results: Anime[]) => void;
  /** campo grande com ícone (página Buscar) */
  large?: boolean;
  /** o que a pessoa digitou (ex.: para buscar pessoas junto) */
  onQuery?: (q: string) => void;
  /** aparece logo abaixo do campo, antes dos animes (ex.: pessoas encontradas) */
  before?: React.ReactNode;
  /** texto de ajuda dentro do campo */
  placeholder?: string;
};

/** Campo de busca + "Adicionar ao catálogo" quando falta o título. */
export function AnimeSearch({ onPick, autoFocus, render, onResults, large = false, onQuery, before, placeholder = t.search.placeholder }: Props) {
  const catalog = useCatalog();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let alive = true;
    catalog.search(q, { limit: 24 }).then((r) => {
      if (!alive) return;
      setResults(r);
      onResults?.(r);
    });
    return () => {
      alive = false;
    };
  }, [q, catalog, onResults]);

  return (
    <div>
      <div className="relative">
        {large && <IconSearch size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" aria-hidden="true" />}
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onQuery?.(e.target.value);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={large ? `${input} h-14 rounded-xl pl-12 text-lg shadow-[0_12px_32px_-18px_rgb(0_0_0/0.6)]` : input}
          aria-label={placeholder}
        />
      </div>
      {before}

      {q.trim() && !(before && q.trim().startsWith("@")) && (
        <div className="mt-4">
          {results.length > 0 ? render(results) : <p className="text-sm text-muted">{t.search.noResults(q.trim())}</p>}
          {!creating && (
            <button type="button" className={`${btnGhost} mt-4`} onClick={() => setCreating(true)}>
              {t.search.createCta}
            </button>
          )}
        </div>
      )}

      {creating && (
        <CreateAnimeForm
          initialTitle={q.trim()}
          onCancel={() => setCreating(false)}
          onCreate={async (input) => {
            const a = await catalog.create(input);
            setCreating(false);
            onPick(a);
          }}
        />
      )}
    </div>
  );
}

function CreateAnimeForm({
  initialTitle,
  onCancel,
  onCreate,
}: {
  initialTitle: string;
  onCancel: () => void;
  onCreate: (i: { title: string; titleOriginal?: string; year?: number; kind: AnimeKind; episodes?: number }) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [original, setOriginal] = useState("");
  const [year, setYear] = useState("");
  const [kind, setKind] = useState<AnimeKind>("tv");
  const [episodes, setEpisodes] = useState("");
  const num = (s: string) => (s.trim() ? Number(s) : undefined);

  return (
    <form
      className={`${card} mt-4 grid gap-3 p-4`}
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate({ title, titleOriginal: original || undefined, year: num(year), kind, episodes: num(episodes) });
      }}
    >
      <h3 className="font-display">{t.search.createTitle}</h3>
      <label className="grid gap-1 text-sm">
        {t.search.fieldTitle}
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      </label>
      <label className="grid gap-1 text-sm">
        {t.search.fieldOriginal}
        <input className={input} value={original} onChange={(e) => setOriginal(e.target.value)} maxLength={200} />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="grid gap-1 text-sm">
          {t.search.fieldYear}
          <input className={input} inputMode="numeric" type="number" min={1910} max={2100} value={year} onChange={(e) => setYear(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          {t.search.fieldKind}
          <select className={input} value={kind} onChange={(e) => setKind(e.target.value as AnimeKind)}>
            {(Object.keys(t.kind) as AnimeKind[]).map((k) => (
              <option key={k} value={k}>
                {t.kind[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {t.search.fieldEpisodes}
          <input className={input} inputMode="numeric" type="number" min={1} max={5000} value={episodes} onChange={(e) => setEpisodes(e.target.value)} />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={btnPrimary}>
          {t.search.save}
        </button>
        <button type="button" className={btnGhost} onClick={onCancel}>
          {t.search.cancel}
        </button>
      </div>
    </form>
  );
}
