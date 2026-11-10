"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { closeLog } from "./LogDrawer";
import { AnimeSearch } from "@/components/AnimeSearch";
import Image from "next/image";
import { IconPlus } from "@/components/Icons";
import { Poster, coverUrl } from "@/components/Poster";
import { Tilt } from "@/components/Tilt";
import { PosterWall } from "@/components/PosterWall";
import { StarRating } from "@/components/StarRating";
import { btnPrimary, card, input } from "@/components/ui";
import type { Anime } from "@/lib/catalog/provider";
import { useCatalog } from "@/lib/catalog/local";
import { diary } from "@/lib/diary/store";
import { formatRating } from "@/lib/rating";
import { t } from "@/messages";

export function todayISO(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

type Props = {
  /** anime já escolhido (ex.: aberto pela página do anime) */
  presetId?: string | null;
  onSaved: (anime: Anime) => void;
  /** chamado ao trocar o anime pré-escolhido */
  onClearPreset?: () => void;
};

/** Só quem está logado registra; visitante vê o convite para entrar. */
export function LogForm(props: Props) {
  const auth = useAuth();
  if (auth.status === "loading") return null;
  if (auth.status === "guest") {
    return (
      // capas em perspectiva no alto do cartão, o convite embaixo
      <div className={`${card} overflow-hidden`}>
        <PosterWall cols={8} className="h-36 sm:h-44" />
        <div className="grid justify-items-start gap-3 p-4 sm:p-5">
          <p className="text-lg font-bold">{t.log.loginRequired}</p>
          <p className="text-sm text-muted">{t.auth.guestCta}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/entrar" className={btnPrimary} onClick={closeLog}>
              {t.auth.signinCta}
            </Link>
            <Link href="/cadastro" className="text-sm underline decoration-link-line underline-offset-4" onClick={closeLog}>
              {t.auth.signupCta}
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return <LogFormFields {...props} />;
}

/** Registrar em 3 toques: anime → nota → salvar. O resto é opcional. */
function LogFormFields({ presetId, onSaved, onClearPreset }: Props) {
  const catalog = useCatalog();
  const [picked, setPicked] = useState<Anime | null>(null);
  const [cleared, setCleared] = useState(false);
  const preset = !cleared && presetId ? catalog.get(presetId) : null;
  const chosen = picked ?? preset;
  // série com várias temporadas: escolhe qual (começa pela que veio, ex.: da página da T3)
  const seasons = chosen ? catalog.series.seasonsOf(chosen.id) : [];
  const [seasonPick, setSeasonPick] = useState<string | null>(null);
  const tab = seasons.find((x) => x.anime.id === seasonPick) ?? seasons.find((x) => x.anime.id === chosen?.id) ?? seasons[0];
  const anime = tab?.anime ?? chosen;
  const series = chosen ? (catalog.get(catalog.series.headOf(chosen.id)) ?? chosen) : null;

  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [date, setDate] = useState(todayISO);
  const [rewatch, setRewatch] = useState(false);

  function save() {
    if (!anime) return;
    diary.addEntry({ animeId: anime.id, ratingHalf: rating, review, watchedOn: date, isRewatch: rewatch }, anime);
    onSaved(anime);
  }

  // 1º só a busca; com o anime escolhido aparecem a nota, os detalhes e o botão
  if (!anime) {
    if (presetId && !cleared && !catalog.ready) return <div className="h-40" />;
    return (
      <section aria-label={t.log.step1}>
        <h2 className="mb-3 text-sm font-bold text-muted">{t.log.step1}</h2>
        <AnimeSearch
          autoFocus
          large
          onPick={setPicked}
          render={(results) => (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {results.slice(0, 12).map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setPicked(a)}
                  className="poster-link rise cursor-pointer text-left"
                  style={{ "--i": i } as React.CSSProperties}
                  aria-label={a.title}
                >
                  <Poster anime={a} />
                  <span className="mt-1.5 block truncate text-xs font-bold">{a.title}</span>
                  <span className="block text-xs text-muted">{[a.year, t.kind[a.kind]].filter(Boolean).join(" · ")}</span>
                </button>
              ))}
            </div>
          )}
        />
      </section>
    );
  }

  const backdrop = coverUrl(series ?? anime);
  return (
    <div className="grid gap-4">
      {/* o anime escolhido: a capa desfocada de fundo, o pôster em 3D */}
      <section className={`${card} rise relative isolate overflow-hidden p-4`} aria-label={t.log.step1}>
        {backdrop && (
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <Image src={backdrop} alt="" fill sizes="320px" className="scale-125 object-cover opacity-55 blur-2xl saturate-150" />
            <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/70 to-card/30" />
          </div>
        )}
        <div className="flex items-center gap-4">
          <Tilt className="w-20 flex-none shadow-[0_16px_32px_-14px_rgb(0_0_0/0.6)] sm:w-24">
            <Poster key={anime.id} anime={anime} />
          </Tilt>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl leading-tight text-balance break-words">{(series ?? anime).title}</p>
            <p className="mt-1 text-sm text-muted">
              {[tab ? t.seasons.long(tab.season, tab.part) : null, anime.year, t.kind[anime.kind]].filter(Boolean).join(" · ")}
            </p>
            <button
              type="button"
              className="mt-3 cursor-pointer text-sm font-bold underline decoration-link-line underline-offset-4 hover:decoration-fg"
              onClick={() => {
                setPicked(null);
                setSeasonPick(null);
                setCleared(true);
                onClearPreset?.();
              }}
            >
              {t.log.change}
            </button>
          </div>
        </div>
      </section>

      {/* qual temporada (só para séries) */}
      {seasons.length > 0 && tab && (
        <section className="rise" aria-label={t.log.season}>
          <h2 className="mb-2 text-sm font-bold text-muted">{t.log.season}</h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.log.season}>
            {seasons.map((x) => {
              const on = x.anime.id === tab.anime.id;
              return (
                <button
                  key={x.anime.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={t.seasons.long(x.season, x.part)}
                  onClick={() => setSeasonPick(x.anime.id)}
                  className={`press cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${
                    on ? "border-active bg-card font-bold text-fg" : "border-line text-muted hover:text-fg"
                  }`}
                >
                  {t.seasons.short(x.season, x.part)}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* nota */}
      <section className="rise" style={{ "--i": 1 } as React.CSSProperties} aria-label={t.log.step2}>
        <h2 className="mb-1 text-sm font-bold text-muted">{t.log.step2}</h2>
        <div className="flex items-center gap-4">
          <StarRating value={rating} onChange={setRating} />
          {rating ? (
            <span className="hanko">{formatRating(rating)}</span>
          ) : (
            <span className="text-sm text-muted">{t.log.noRating}</span>
          )}
        </div>
      </section>

      {/* detalhes opcionais */}
      <details className={`${card} rise group px-4 py-3`} style={{ "--i": 2 } as React.CSSProperties}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
          <span>
            {t.log.review}, {t.log.date.toLowerCase()}, {t.log.rewatch.toLowerCase()}
          </span>
          <IconPlus size={18} className="flex-none text-muted transition-transform duration-300 group-open:rotate-45" />
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

      <button type="button" className={`${btnPrimary} rise h-12 w-full text-base`} style={{ "--i": 3 } as React.CSSProperties} onClick={save}>
        {t.log.save}
      </button>
    </div>
  );
}
