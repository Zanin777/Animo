"use client";

// Ajuste da foto/capa antes de enviar: arrastar para posicionar e zoom.
// Só calcula o recorte (em pixels da imagem original); quem corta é o upload.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cropRect, type Crop } from "@/lib/profile/crop";
import { t } from "@/messages";
import { btnGhost, btnPrimary } from "./ui";

type Props = {
  file: File;
  /** largura / altura do resultado */
  aspect: number;
  round: boolean;
  title: string;
  onApply: (crop: Crop) => void;
  onCancel: () => void;
  /** a imagem não abriu (tipo errado, arquivo corrompido) */
  onInvalid: () => void;
};

export function ImageCropper({ file, aspect, round, title, onApply, onCancel, onInvalid }: Props) {
  // o link blob: só é liberado depois que a imagem carrega (a <img> continua mostrando)
  const [url] = useState(() => URL.createObjectURL(file));
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  const crop = nat ? cropRect(nat.w, nat.h, aspect, zoom, center.x, center.y) : null;

  /** move o recorte pelo deslocamento em pixels de tela */
  function pan(dx: number, dy: number) {
    if (!crop || !frame.current) return;
    const k = frame.current.clientWidth / crop.sw;
    setCenter({ x: crop.sx + crop.sw / 2 - dx / k, y: crop.sy + crop.sh / 2 - dy / k });
  }
  const zoomBy = (f: number) => setZoom((z) => Math.min(Math.max(z * f, 1), 4));

  function onPointerDown(e: PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: PointerEvent) {
    if (!last.current) return;
    pan(e.clientX - last.current.x, e.clientY - last.current.y);
    last.current = { x: e.clientX, y: e.clientY };
  }
  function onKey(e: KeyboardEvent) {
    const step = 12;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) pan(...moves[e.key]);
    else if (e.key === "+" || e.key === "=") zoomBy(1.1);
    else if (e.key === "-") zoomBy(1 / 1.1);
    else return;
    e.preventDefault();
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="crop-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-xl border border-line bg-bg p-4 text-fg backdrop:bg-black/60"
    >
      <h2 id="crop-title" className="mb-1 font-display text-xl">
        {title}
      </h2>
      <p className="mb-3 text-sm text-muted">{t.profile.cropHint}</p>
      <div
        ref={frame}
        tabIndex={0}
        role="application"
        aria-label={t.profile.cropHint}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (last.current = null)}
        onPointerCancel={() => (last.current = null)}
        onWheel={(e) => zoomBy(e.deltaY < 0 ? 1.08 : 1 / 1.08)}
        onKeyDown={onKey}
        className={`relative mx-auto cursor-grab touch-none overflow-hidden rounded-lg bg-black outline-offset-2 select-none active:cursor-grabbing ${round ? "w-full max-w-72" : "w-full"}`}
        style={{ aspectRatio: aspect }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:), não passa pelo otimizador */}
        <img
          src={url}
          alt=""
          draggable={false}
          onLoad={(e) => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
            URL.revokeObjectURL(url);
            setNat({ w, h });
            setCenter({ x: w / 2, y: h / 2 });
          }}
          onError={() => {
            URL.revokeObjectURL(url);
            onInvalid();
          }}
          className="absolute max-w-none"
          style={
            crop && nat
              ? {
                  width: `${(nat.w / crop.sw) * 100}%`,
                  height: `${(nat.h / crop.sh) * 100}%`,
                  left: `${(-crop.sx / crop.sw) * 100}%`,
                  top: `${(-crop.sy / crop.sh) * 100}%`,
                }
              : { visibility: "hidden" }
          }
        />
        {round && <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />}
      </div>
      <label className="mt-4 flex items-center gap-3 text-sm">
        {t.profile.cropZoom}
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-[var(--color-accent)]"
        />
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className={btnGhost} onClick={onCancel}>
          {t.profile.cancel}
        </button>
        <button type="button" className={btnPrimary} disabled={!crop} onClick={() => crop && onApply(crop)}>
          {t.profile.cropApply}
        </button>
      </div>
    </dialog>
  );
}
