"use client";

import Image from "next/image";
import { useState } from "react";
import type { Anime } from "@/lib/catalog/provider";
import { posterStyle } from "@/lib/poster";
import { t } from "@/messages";

type Props = {
  anime: Pick<Anime, "title" | "year" | "kind" | "cover">;
  /** xs: miniatura em linhas do diário (sem rodapé) */
  size?: "xs" | "md";
  className?: string;
};

// Só caminhos de pôster do TMDB; qualquer outra coisa cai no pôster tipográfico.
const COVER_PATH = /^\/[A-Za-z0-9_-]{5,64}\.(jpg|png)$/;

/**
 * Capa do TMDB quando existe; senão (ou se a imagem falhar) o pôster
 * tipográfico da direção de arte. A imagem passa pelo otimizador do Next,
 * então o navegador do usuário nunca fala direto com o TMDB.
 */
export function Poster({ anime, size = "md", className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const { palette, variant, fontSize } = posterStyle(anime.title);
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
      <div className="poster-t" style={{ fontSize: xs ? 9 : fontSize }}>
        {anime.title}
      </div>
      <div className="poster-meta">
        <span>{anime.year ?? ""}</span>
        <span>{t.kind[anime.kind]}</span>
      </div>
      {cover && (
        <Image
          src={`https://image.tmdb.org/t/p/w342${cover}`}
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
