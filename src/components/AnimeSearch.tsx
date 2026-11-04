"use client";

import { useEffect, useState } from "react";
import type { Anime, AnimeKind } from "@/lib/catalog/provider";
import { useCatalog } from "@/lib/catalog/local";
import { t } from "@/messages";
import { btnGhost, btnPrimary, card, input } from "./ui";

type Props = {
  onPick: (anime: Anime) => void;
  autoFocus?: boolean;
  /** como mostrar os resultados */
  render: (results: Anime[]) => React.ReactNode;
};

/** Campo de busca + "Adicionar ao catálogo" quando falta o título. */
export function AnimeSearch({ onPick, autoFocus, render }: Props) {
  const catalog = useCatalog();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let alive = true;
    catalog.search(q, { limit: 24 }).then((r) => alive && setResults(r));
    return () => {
      alive = false;
    };
  }, [q, catalog]);

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.search.placeholder}
        autoFocus={autoFocus}
        className={input}
        aria-label={t.search.placeholder}
      />

      {q.trim() && (
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
