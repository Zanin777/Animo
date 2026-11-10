"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { t } from "@/messages";
import { IconArrowRight } from "./Icons";

/**
 * Faixa horizontal (carrossel). No celular rola com o dedo; no computador ganha
 * setas nas pontas, que somem quando não há mais nada daquele lado.
 */
export function Rail({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  // conteúdo muda (troca de aba) ou a tela muda de tamanho → recalcula as pontas
  useEffect(update);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={update}
        role="region"
        aria-label={label}
        // Rolagem horizontal corta o que passa da caixa na vertical também. O pôster
        // cresce ~15px para cima ao passar o cursor (escala + subida + contorno):
        // pt-5 dá essa folga e -mt-2 devolve o espaço, sem empurrar o que vem antes.
        className={`no-scrollbar -mx-4 -mt-2 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pt-5 pb-3 ${className}`}
      >
        {children}
      </div>
      <RailButton dir={-1} hidden={edge.start} onClick={() => go(-1)} />
      <RailButton dir={1} hidden={edge.end} onClick={() => go(1)} />
    </div>
  );
}

function RailButton({ dir, hidden, onClick }: { dir: 1 | -1; hidden: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      aria-label={dir === 1 ? t.home.railNext : t.home.railPrev}
      title={dir === 1 ? t.home.railNext : t.home.railPrev}
      className={`press absolute top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-line bg-bg text-fg shadow-[0_6px_16px_rgb(0_0_0/0.28)] transition-opacity duration-200 hover:text-detail md:grid ${
        dir === 1 ? "-right-5" : "-left-5"
      } ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <IconArrowRight size={18} className={dir === -1 ? "rotate-180" : undefined} />
    </button>
  );
}
