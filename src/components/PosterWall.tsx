"use client";

import { Poster } from "@/components/Poster";
import type { Anime } from "@/lib/catalog/provider";
import { useCatalog } from "@/lib/catalog/local";
import { FEATURED_IDS } from "@/lib/catalog/seed";

const PER_COL = 6;

/**
 * Parede de capas inclinada em perspectiva, com as colunas rolando devagar
 * (estilos .wall em globals.css). Decorativa: escondida de leitores de tela e
 * parada com "reduzir movimento".
 */
export function PosterWall({ className = "", cols: count = 4 }: { className?: string; cols?: number }) {
  const { ready, all, get } = useCatalog();
  if (!ready) return <div className={className} aria-hidden="true" />;

  const seen = new Set<string>();
  const pool: Anime[] = [];
  for (const a of [...FEATURED_IDS.map(get), ...all]) {
    if (!a || !a.cover || seen.has(a.id)) continue;
    seen.add(a.id);
    pool.push(a);
    if (pool.length === PER_COL * count) break;
  }
  const cols = Array.from({ length: count }, (_, c) => pool.slice(c * PER_COL, (c + 1) * PER_COL));

  return (
    <div className={`wall overflow-hidden ${className}`} aria-hidden="true">
      <div className="wall-plane" style={{ "--cols": count } as React.CSSProperties}>
        {cols.map((col, c) => (
          // a coluna aparece duas vezes seguidas para o laço não ter emenda
          <div key={c} className="wall-col">
            {[...col, ...col].map((a, i) => (
              <Poster key={`${a.id}-${i}`} anime={a} className="shadow-[0_18px_30px_-14px_rgb(0_0_0/0.7)]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
