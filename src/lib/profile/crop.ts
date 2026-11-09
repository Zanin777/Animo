// Recorte da foto/capa escolhido pelo usuário, em pixels da imagem original.

export type Crop = { sx: number; sy: number; sw: number; sh: number };

/**
 * Retângulo de recorte com a proporção `aspect` (largura/altura).
 * zoom 1 = maior recorte que cabe na imagem; cx, cy = centro desejado (pixels da imagem),
 * ajustado para o recorte nunca sair da imagem.
 */
export function cropRect(iw: number, ih: number, aspect: number, zoom: number, cx: number, cy: number): Crop {
  const z = Math.min(Math.max(zoom, 1), 8);
  const bw = Math.min(iw, ih * aspect);
  const sw = bw / z;
  const sh = sw / aspect;
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
  const x = clamp(cx, sw / 2, iw - sw / 2);
  const y = clamp(cy, sh / 2, ih - sh / 2);
  return { sx: x - sw / 2, sy: y - sh / 2, sw, sh };
}
