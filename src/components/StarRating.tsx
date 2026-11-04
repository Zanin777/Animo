"use client";

import { formatRating } from "@/lib/rating";

type Props = {
  /** meias estrelas 1..10, ou null */
  value: number | null;
  onChange: (half: number | null) => void;
};

/** 5 estrelas; metade esquerda = meia estrela. Tocar na nota atual limpa. */
export function StarRating({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Nota">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = value === null ? 0 : Math.max(0, Math.min(1, (value - (star - 1) * 2) / 2));
        return (
          <span key={star} className="relative inline-block text-[40px] leading-none select-none">
            <span className="text-line">★</span>
            <span
              className="absolute inset-0 overflow-hidden text-accent"
              style={{ width: `${fill * 100}%` }}
              aria-hidden="true"
            >
              ★
            </span>
            {[star * 2 - 1, star * 2].map((half, i) => (
              <button
                key={half}
                type="button"
                role="radio"
                aria-checked={value === half}
                aria-label={`${formatRating(half)} estrelas`}
                onClick={() => onChange(value === half ? null : half)}
                className={`absolute top-0 h-full w-1/2 cursor-pointer ${i === 0 ? "left-0" : "right-0"}`}
              />
            ))}
          </span>
        );
      })}
    </div>
  );
}
