// Ícones do Aniora (escolhidos em 2026-11-10), desenhados com next/og (ImageResponse):
// - aba do navegador: o carimbo hanko rosa com ア em tinta (o "A" de Aniora em katakana);
// - app (celular, tela inicial do iPhone): o "a" do logo em estilo mangá, rosa no escuro,
//   com linhas de velocidade turquesa e o ponto de "aniora.".
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const PINK = "#e0445a";
const INK = "#14161c";
const PAPER = "#f3f1ec";
const TEAL = "#43d9c3";

// Só as letras "aniora." da Dela Gothic One (SIL OFL 1.1), ~2 KB.
const font = () => readFile(join(process.cwd(), "src/app/_icon/dela-gothic-one-aniora.woff"));

const svgUrl = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/** Selo ア ocupando o ícone todo, em grade de 64 (cantos arredondados, fundo transparente fora). */
const STAMP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${PINK}"/>
  <rect x="6" y="6" width="52" height="52" rx="10" fill="none" stroke="${INK}" stroke-width="3" opacity=".9"/>
  <path d="M17 19 H47 C45.5 29 40 34 33 38" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M30 28 C30.5 38 28 44 21 49" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
</svg>`;

/** Aba do navegador: o selo ア. */
export function faviconImage(size: number) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse só aceita <img> */}
        <img src={svgUrl(STAMP)} width={size} height={size} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}

/** Linhas de velocidade e o ponto, na mesma grade de 64 do desenho aprovado. */
const MOTION = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M4 26 L19 24.5 L19 28.5 Z M2 35 L17 33 L17 37 Z M5 44 L18 42.5 L18 46.5 Z" fill="${TEAL}"/>
  <circle cx="55.5" cy="47" r="5" fill="${PAPER}"/>
</svg>`;

/**
 * Ícone de app: fundo escuro em toda a área (o sistema arredonda os cantos) e o desenho
 * em 80% do centro, dentro da área segura dos ícones "maskable" do Android.
 */
export async function appIconImage(size: number) {
  const art = Math.round(size * 0.8);
  const u = art / 64; // 1 unidade do desenho em px
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: INK }}>
        <div style={{ width: art, height: art, display: "flex", position: "relative", marginTop: -12 * u }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse só aceita <img> */}
          <img src={svgUrl(MOTION)} width={art} height={art} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
          <div
            style={{
              position: "absolute",
              left: 20 * u,
              top: 7 * u,
              fontFamily: "Dela",
              fontSize: 46 * u,
              lineHeight: 1,
              color: PINK,
              transform: "skewX(-13deg)",
            }}
          >
            a
          </div>
        </div>
      </div>
    ),
    { width: size, height: size, fonts: [{ name: "Dela", data: await font(), style: "normal", weight: 400 }] },
  );
}
