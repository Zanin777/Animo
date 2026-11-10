// Recorta cada expressão da folha da mascote (docs/mascote/folha-original.webp)
// em arquivos separados. Uso: node tools/crop-mascote.mjs
// (Fora do site por enquanto: a mascote não foi aprovada para as telas em 05/11/2026.)
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const SRC = "docs/mascote/folha-original.webp";
const OUT = "docs/mascote/recortes";

// [nome, left, top, width, height] em pixels da folha 1536×1024.
// Os nomes dizem o uso no site, não só a expressão.
export const CROPS = [
  ["retrato", 0, 0, 760, 1024], //        pensativa, mão no rosto (entrar/cadastro)
  ["piscadinha", 786, 84, 280, 280], //   piscando, feliz (boas-vindas)
  ["rindo", 742, 408, 262, 238], //       rindo de olhos fechados (registro salvo)
  ["reticencias", 1004, 408, 262, 238], // "…" (listas e diário vazios)
  ["duvida", 1266, 408, 270, 238], //     "?" (busca sem resultado)
  ["brava", 742, 694, 262, 250], //       irritada (erro)
  ["surpresa", 1004, 694, 262, 250], //   "!!" (página não encontrada)
  ["dormindo", 1266, 694, 270, 250], //   "zzz" (sem atividade ainda)
];

mkdirSync(OUT, { recursive: true });
for (const [name, left, top, width, height] of CROPS) {
  await sharp(SRC).extract({ left, top, width, height }).webp({ quality: 88 }).toFile(`${OUT}/${name}.webp`);
}
console.log(`ok: ${CROPS.length} recortes em ${OUT}/`);
