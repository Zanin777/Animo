"use client";

import Link from "next/link";
import { useState } from "react";
import { Poster } from "@/components/Poster";
import { Muted, PageTitle, btnGhost, btnPrimary, card, input } from "@/components/ui";
import { useCatalog } from "@/lib/catalog/local";
import { diary, useDiary } from "@/lib/diary/store";
import { t } from "@/messages";

export function ListsView() {
  const { lists } = useDiary();
  const catalog = useCatalog();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageTitle
        aside={
          !creating && (
            <button type="button" className={btnPrimary} onClick={() => setCreating(true)}>
              {t.lists.create}
            </button>
          )
        }
      >
        {t.lists.title}
      </PageTitle>

      {creating && <CreateListForm onDone={() => setCreating(false)} />}

      {lists.length === 0 && !creating ? (
        <Muted>{t.lists.empty}</Muted>
      ) : (
        <div className="grid gap-3">
          {lists.map((l) => (
            <Link key={l.id} href={`/listas/${l.id}`} className={`${card} flex items-center gap-4 p-3`}>
              <div className="flex w-24 flex-none -space-x-6">
                {l.items.slice(0, 3).map((i) => {
                  const a = catalog.get(i.animeId);
                  return a ? <Poster key={i.animeId} anime={a} size="xs" className="w-12 ring-2 ring-card" /> : null;
                })}
                {l.items.length === 0 && <div className="aspect-[2/3] w-12 rounded-md border border-dashed border-line" />}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-bold">{l.title}</h2>
                <p className="text-sm text-muted">{t.lists.items(l.items.length)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function CreateListForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ranked, setRanked] = useState(false);
  return (
    <form
      className={`${card} mb-6 grid gap-3 p-4`}
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        diary.createList({ title, description, isRanked: ranked });
        onDone();
      }}
    >
      <label className="grid gap-1 text-sm">
        {t.lists.fieldTitle}
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} autoFocus />
      </label>
      <label className="grid gap-1 text-sm">
        {t.lists.fieldDescription}
        <textarea className={input} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={ranked} onChange={(e) => setRanked(e.target.checked)} className="accent-[var(--accent)]" />
        {t.lists.ranked}
      </label>
      <div className="flex gap-2">
        <button type="submit" className={btnPrimary}>
          {t.lists.save}
        </button>
        <button type="button" className={btnGhost} onClick={onDone}>
          {t.search.cancel}
        </button>
      </div>
    </form>
  );
}
