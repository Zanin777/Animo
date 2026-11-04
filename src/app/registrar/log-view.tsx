"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimeSearch } from "@/components/AnimeSearch";
import { Poster } from "@/components/Poster";
import { StarRating } from "@/components/StarRating";
import { PageTitle, btnGhost, btnPrimary, card, input } from "@/components/ui";
import type { Anime } from "@/lib/catalog/provider";
import { useCatalog } from "@/lib/catalog/local";
import { diary } from "@/lib/diary/store";
import { formatRating } from "@/lib/rating";
import { t } from "@/messages";

export function todayISO(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Registrar em 3 toques: anime → nota → salvar. O resto é opcional. */
export function LogView() {
  const router = useRouter();
  const params = useSearchParams();
  const catalog = useCatalog();

  const [picked, setPicked] = useState<Anime | null>(null);
  const preset = params.get("anime");
  const anime = picked ?? (preset ? catalog.get(preset) : null);

  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [date, setDate] = useState(todayISO());
  const [rewatch, setRewatch] = useState(false);

  function save() {
    if (!anime) return;
    diary.addEntry({ animeId: anime.id, ratingHalf: rating, review, watchedOn: date, isRewatch: rewatch }, anime);
    router.push("/");
  }

  return (
    <>
      <PageTitle>{t.log.title}</PageTitle>

      <Step n={1} title={t.log.step1}>
        {!anime && preset && !catalog.ready ? (
          <div className="h-12" />
        ) : anime ? (
          <div className="flex items-center gap-3">
            <Poster anime={anime} size="xs" className="w-12 flex-none" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{anime.title}</div>
              <div className="text-sm text-muted">
                {anime.year} · {t.kind[anime.kind]}
              </div>
            </div>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                setPicked(null);
                if (preset) router.replace("/registrar");
              }}
            >
              {t.log.change}
            </button>
          </div>
        ) : (
          <AnimeSearch
            autoFocus
            onPick={setPicked}
            render={(results) => (
              <div className="grid gap-1.5">
                {results.slice(0, 8).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setPicked(a)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-1.5 text-left hover:bg-bg"
                  >
                    <Poster anime={a} size="xs" className="w-9 flex-none" />
                    <span className="min-w-0 flex-1 truncate">{a.title}</span>
                    <span className="text-sm text-muted">{a.year}</span>
                  </button>
                ))}
              </div>
            )}
          />
        )}
      </Step>

      <Step n={2} title={t.log.step2} disabled={!anime}>
        <div className="flex items-center gap-4">
          <StarRating value={rating} onChange={setRating} />
          <span className="font-display text-xl text-accent">{rating ? formatRating(rating) : ""}</span>
        </div>
        {rating === null && <p className="mt-1 text-sm text-muted">{t.log.noRating}</p>}
      </Step>

      <Step n={3} title={t.log.step3} disabled={!anime}>
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-muted">
            {t.log.review}, {t.log.date.toLowerCase()}, {t.log.rewatch.toLowerCase()}
          </summary>
          <div className="mt-3 grid gap-3">
            <textarea
              className={`${input} min-h-24`}
              placeholder={t.log.reviewPlaceholder}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={10000}
              aria-label={t.log.review}
            />
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                {t.log.date}
                <input
                  type="date"
                  className={`${input} w-auto`}
                  value={date}
                  max={todayISO()}
                  onChange={(e) => setDate(e.target.value || todayISO())}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={rewatch} onChange={(e) => setRewatch(e.target.checked)} className="accent-[var(--accent)]" />
                {t.log.rewatch}
              </label>
            </div>
          </div>
        </details>
        <button type="button" className={btnPrimary} disabled={!anime} onClick={save}>
          {t.log.save}
        </button>
      </Step>
    </>
  );
}

function Step({ n, title, disabled, children }: { n: number; title: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <section className={`${card} mb-3 p-4 ${disabled ? "opacity-40" : ""}`} inert={disabled}>
      <h2 className="mb-3 text-sm font-bold">
        <span className="mr-1.5 font-display font-normal text-accent">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
