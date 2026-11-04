import type { Anime } from "@/lib/catalog/provider";
import { posterStyle } from "@/lib/poster";
import { t } from "@/messages";

type Props = {
  anime: Pick<Anime, "title" | "year" | "kind">;
  /** xs: miniatura em linhas do diário (sem rodapé) */
  size?: "xs" | "md";
  className?: string;
};

export function Poster({ anime, size = "md", className = "" }: Props) {
  const { palette, variant, fontSize } = posterStyle(anime.title);
  const xs = size === "xs";
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
    </div>
  );
}
