import { sealImage } from "./_icon/seal";

// /icon/favicon (aba do navegador) e /icon/app-192, /icon/app-512 (manifest, Android).
export function generateImageMetadata() {
  return [
    { id: "favicon", size: { width: 48, height: 48 }, contentType: "image/png" },
    { id: "app-192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "app-512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const which = String(await id);
  if (which === "app-192") return sealImage(192, true);
  if (which === "app-512") return sealImage(512, true);
  return sealImage(48, false);
}
