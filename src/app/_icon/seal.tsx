// Ícone do Aniora: o selo hanko carmesim com o "a" do logo.
// Desenhado com next/og (ImageResponse) para favicon, ícone do app e da tela inicial.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const CRIMSON = "#c41e3a";
const PAPER = "#f2efe8";
const INK = "#14161c";

// Só as letras "aniora." da Dela Gothic One (SIL OFL 1.1), ~2 KB.
const font = () => readFile(join(process.cwd(), "src/app/_icon/dela-gothic-one-aniora.woff"));

/**
 * size: lado em px. framed: fundo de papel-tinta quadrado (ícone de app);
 * sem framed, só o selo com fundo transparente (favicon).
 */
export async function sealImage(size: number, framed: boolean) {
  const seal = Math.round(size * (framed ? 0.74 : 1));
  const ring = Math.max(1, Math.round(seal * 0.045));
  const inset = Math.round(seal * 0.075);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: framed ? INK : "transparent",
        }}
      >
        <div
          style={{
            width: seal,
            height: seal,
            borderRadius: "50%",
            background: CRIMSON,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(-8deg)",
            position: "relative",
          }}
        >
          {/* anel interno do carimbo (some no favicon pequeno) */}
          {seal >= 64 && (
            <div
              style={{
                position: "absolute",
                top: inset,
                left: inset,
                right: inset,
                bottom: inset,
                borderRadius: "50%",
                border: `${ring}px solid ${PAPER}`,
                opacity: 0.55,
              }}
            />
          )}
          <div
            style={{
              fontFamily: "Dela",
              fontSize: Math.round(seal * (seal >= 64 ? 0.56 : 0.78)),
              color: PAPER,
              lineHeight: 1,
              marginTop: -Math.round(seal * 0.12),
            }}
          >
            a
          </div>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: "Dela", data: await font(), style: "normal", weight: 400 }],
    },
  );
}
