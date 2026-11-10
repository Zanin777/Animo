"use client";

import Image from "next/image";
import { useState, ViewTransition } from "react";
import type { Anime } from "@/lib/catalog/provider";
import { posterStyle, posterTitleSize } from "@/lib/poster";
import { t } from "@/messages";

type Props = {
  anime: Pick<Anime, "title" | "year" | "kind" | "cover">;
  /** xs: miniatura em linhas do diário (sem rodapé) */
  size?: "xs" | "md";
  className?: string;
};

// Só nomes de arquivo de capa do AniList; qualquer outra coisa cai no pôster tipográfico.
const COVER_PATH = /^\/[A-Za-z0-9_-]{5,64}\.(jpg|png)$/;
const COVER_BASE = "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large";

/** URL da capa (para fundos desfocados etc.) ou null quando não há capa válida. */
export function coverUrl(anime: Pick<Anime, "cover">): string | null {
  return anime.cover && COVER_PATH.test(anime.cover) ? `${COVER_BASE}${anime.cover}` : null;
}

/**
 * Pôster que "voa" entre páginas: mesmo nome na grade da busca e no topo da página
 * do anime. Use só onde o anime aparece uma vez na tela (nome repetido cancela a animação).
 */
export function SharedPoster({ anime, className = "" }: { anime: Pick<Anime, "id" | "title" | "year" | "kind" | "cover">; className?: string }) {
  return (
    <ViewTransition name={`poster-${anime.id}`} share="morph" default="none">
      <Poster anime={anime} className={className} />
    </ViewTransition>
  );
}

/**
 * Capa do AniList quando existe; senão (ou se a imagem falhar) o pôster
 * tipográfico da direção de arte. A imagem passa pelo otimizador do Next,
 * então o navegador do usuário nunca fala direto com o AniList.
 */
export function Poster({ anime, size = "md", className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const { palette, variant, fontSize, longestWord } = posterStyle(anime.title);
  const xs = size === "xs";
  const cover = !failed && anime.cover && COVER_PATH.test(anime.cover) ? anime.cover : null;

  return (
    <div
      className={`poster ${xs ? "poster-xs" : ""} ${className}`}
      style={{ background: palette.bg, color: palette.fg }}
      aria-hidden="true"
    >
      {variant === "mark" && <div className="poster-mark" style={{ background: palette.mark }} />}
      {variant === "rule" && <div className="poster-rule" style={{ background: palette.fg }} />}
      <div className="poster-t" style={{ fontSize: xs ? 9 : posterTitleSize(fontSize, longestWord) }}>
        {anime.title}
      </div>
      <div className="poster-meta">
        <span>{anime.year ?? ""}</span>
        <span>{t.kind[anime.kind]}</span>
      </div>
      {cover && (
        <Image
          src={`${COVER_BASE}${cover}`}
          alt=""
          fill
          sizes={xs ? "64px" : "(min-width: 768px) 180px, 33vw"}
          className="z-[2] object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
