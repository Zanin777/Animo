import { sealImage } from "./_icon/seal";

// Ícone de "Adicionar à Tela de Início" no iPhone.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return sealImage(180, true);
}
