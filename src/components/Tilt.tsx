"use client";

import { useRef, type ReactNode } from "react";

/**
 * Inclina o conteúdo em 3D seguindo o mouse, com um reflexo de luz por cima
 * (estilos .tilt / .tilt-glare em globals.css). Só reage a mouse: no toque o
 * pôster fica parado, e "reduzir movimento" desliga pelo CSS.
 */
export function Tilt({ children, max = 9, className = "" }: { children: ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  function move(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${((0.5 - y) * max).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * max).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      el.dataset.tilting = "";
    });
  }

  function leave() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    for (const p of ["--rx", "--ry", "--gx", "--gy"]) el.style.removeProperty(p);
    delete el.dataset.tilting;
  }

  return (
    <div ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave}>
      {children}
      <span className="tilt-glare" aria-hidden="true" />
    </div>
  );
}
