"use client";

// Envio de foto e capa do perfil para o Supabase Storage.
// A imagem é redesenhada num <canvas> antes de subir: fica pequena (WebP) e
// perde os metadados da foto original (como a localização do celular).
import { getSupabase } from "@/lib/supabase/client";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { cropRect, type Crop } from "./crop";

export type UploadKind = "avatar" | "banner";

const SPEC = {
  avatar: { bucket: "avatars", w: 512, h: 512 },
  banner: { bucket: "banners", w: 1600, h: 500 },
} as const;

const MAX_INPUT_BYTES = 15 * 1024 * 1024; // foto de celular cabe com folga
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export type UploadError = "type" | "size" | "decode" | "login" | "reserved" | "network";

export const ASPECT: Record<UploadKind, number> = { avatar: SPEC.avatar.w / SPEC.avatar.h, banner: SPEC.banner.w / SPEC.banner.h };

/** Recorta (no centro, ou onde o usuário ajustou) para o tamanho alvo e devolve um WebP. */
async function toWebp(file: File, w: number, h: number, crop?: Crop): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const { sx, sy, sw, sh } = crop ?? cropRect(bmp.width, bmp.height, w / h, 1, bmp.width / 2, bmp.height / 2);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.86));
  if (!blob) throw new Error("toBlob");
  return blob;
}

/** Sobe a imagem para <bucket>/<id-do-usuário>/<tipo>-<data>.webp e devolve o caminho público. */
export async function uploadProfileImage(kind: UploadKind, file: File, userId: string | null, crop?: Crop): Promise<{ path: string } | { error: UploadError }> {
  if (!ACCEPTED.includes(file.type)) return { error: "type" };
  if (file.size > MAX_INPUT_BYTES) return { error: "size" };
  const sb = getSupabase();
  if (!sb || !userId) return { error: "login" };
  const { bucket, w, h } = SPEC[kind];
  let blob: Blob;
  try {
    blob = await toWebp(file, w, h, crop);
  } catch {
    return { error: "decode" };
  }
  const name = `${userId}/${kind}-${Date.now()}.webp`;
  const { error } = await sb.storage.from(bucket).upload(name, blob, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });
  if (error) return { error: /row-level security|unauthorized|403/i.test(error.message) ? "reserved" : "network" };
  return { path: `/storage/v1/object/public/${bucket}/${name}` };
}

/** Apaga a imagem anterior (melhor esforço: se falhar, só sobra um arquivo órfão). */
export async function removeProfileImage(path: string | null) {
  const m = path?.match(/^\/storage\/v1\/object\/public\/(avatars|banners)\/(.+)$/);
  const sb = getSupabase();
  if (!m || !sb) return;
  await sb.storage.from(m[1]).remove([m[2]]);
}

/** URL completa de uma imagem do Storage (só caminhos do nosso projeto). */
export function storageUrl(path: string | null): string | null {
  if (!path || !SUPABASE_URL || !/^\/storage\/v1\/object\/public\/(avatars|banners)\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/.test(path)) return null;
  return SUPABASE_URL + path;
}
