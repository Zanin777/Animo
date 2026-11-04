"use client";

// Adaptado de "Sliding Number" do Motion Primitives (também listado no 21st.dev).
// https://github.com/ibelick/motion-primitives — commit 120f64f — components/core/sliding-number.tsx
// MIT License, Copyright (c) 2024 ibelick. Texto completo em third-party/motion-primitives.LICENSE.md
//
// Mudanças: leitor de tela ouve só o número (não os 10 dígitos de cada casa),
// respeita "reduzir movimento" do sistema, vírgula como separador decimal,
// componente interno renomeado (não sombreia o Number global).
import { useEffect, useId } from "react";
import { motion, motionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import useMeasure from "react-use-measure";

const TRANSITION = { type: "spring" as const, stiffness: 280, damping: 18, mass: 0.3 };

function Digit({ value, place }: { value: number; place: number }) {
  const valueRoundedToPlace = Math.floor(value / place) % 10;
  const initial = motionValue(valueRoundedToPlace);
  const animatedValue = useSpring(initial, TRANSITION);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <span className="relative inline-block w-[1ch] overflow-x-visible overflow-y-clip leading-none tabular-nums">
      <span className="invisible">0</span>
      {Array.from({ length: 10 }, (_, i) => (
        <DigitGlyph key={i} mv={animatedValue} digit={i} />
      ))}
    </span>
  );
}

function DigitGlyph({ mv, digit }: { mv: MotionValue<number>; digit: number }) {
  const uniqueId = useId();
  const [ref, bounds] = useMeasure();

  const y = useTransform(mv, (latest) => {
    if (!bounds.height) return 0;
    const placeValue = latest % 10;
    const offset = (10 + digit - placeValue) % 10;
    let memo = offset * bounds.height;
    if (offset > 5) memo -= 10 * bounds.height;
    return memo;
  });

  // só anima depois de saber a altura
  if (!bounds.height) {
    return (
      <span ref={ref} className="invisible absolute">
        {digit}
      </span>
    );
  }

  return (
    <motion.span
      style={{ y }}
      layoutId={`${uniqueId}-${digit}`}
      className="absolute inset-0 flex items-center justify-center"
      transition={TRANSITION}
      ref={ref}
    >
      {digit}
    </motion.span>
  );
}

type Props = {
  value: number;
  /** casas decimais a mostrar (ex.: 1 para nota média) */
  decimals?: number;
};

export function SlidingNumber({ value, decimals = 0 }: Props) {
  const reduce = useReducedMotion();
  const fixed = Math.abs(value).toFixed(decimals);
  const label = (value < 0 ? "-" : "") + fixed.replace(".", ",");

  if (reduce) return <span className="tabular-nums">{label}</span>;

  const [integerPart, decimalPart] = fixed.split(".");
  const integerValue = parseInt(integerPart, 10);
  const integerDigits = integerPart.split("");
  const places = integerDigits.map((_, i) => Math.pow(10, integerDigits.length - i - 1));

  return (
    <span className="inline-flex items-center">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="inline-flex items-center">
        {value < 0 && "-"}
        {integerDigits.map((_, i) => (
          <Digit key={`pos-${places[i]}`} value={integerValue} place={places[i]} />
        ))}
        {decimalPart && (
          <>
            <span>,</span>
            {decimalPart.split("").map((_, i) => (
              <Digit key={`dec-${i}`} value={parseInt(decimalPart, 10)} place={Math.pow(10, decimalPart.length - i - 1)} />
            ))}
          </>
        )}
      </span>
    </span>
  );
}
