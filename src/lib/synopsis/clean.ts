// Limpeza da sinopse que vem de fora (TMDB em pt-BR, AniList em inglês).
// O resultado é TEXTO PURO, mostrado pelo React como texto: nunca vira HTML.

/** Resposta da rota /api/synopsis/[id]. */
export interface SynopsisResponse {
  animeId: string;
  /** null = não há sinopse para este anime */
  text: string | null;
  lang: "pt-BR" | "en" | null;
  source: "tmdb" | "anilist" | null;
}

/** "Pequena sinopse": o que passar disso é cortado no fim de uma frase. */
export const SYNOPSIS_MAX = 700;

const TAG = /<\/?[a-z][^>]{0,300}>/gi;
const UNSAFE =/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/g;

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

function decodeEntity(whole: string, body: string): string {
  if (body[0] !== "#") return ENTITIES[body.toLowerCase()] ?? whole;
  const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
  return Number.isInteger(code) && code > 31 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
}

/** Corta no fim da última frase que cabe; sem frase inteira, corta na palavra e põe "…". */
function shorten(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (end >= max * 0.5) return cut.slice(0, end + 1);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > 0 ? space : max).replace(/[\s,;:–—-]+$/, "")}…`;
}

/**
 * Texto de sinopse → um parágrafo curto e limpo, ou null se não sobrar nada.
 * Tira tags, spoilers do AniList (~!…!~), créditos "(Source: …)" e notas de rodapé.
 */
export function cleanSynopsis(raw: unknown, max = SYNOPSIS_MAX): string | null {
  if (typeof raw !== "string" || raw.length > 20000) return null;
  const paragraphs = raw
    .replace(/~!([\s\S]*?)!~/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(TAG, "")
    .replace(/&(#x?[0-9a-f]{1,6}|[a-z]{2,8});/gi, decodeEntity)
    .replace(TAG, "") // de novo: "&lt;b&gt;" decodificado também não fica com cara de tag
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((p) =>
      p
        .replace(UNSAFE, "")
        .replace(/\s+/g, " ")
        .replace(/[([]\s*(source|fonte)\s*:[^)\]]*[)\]]/gi, "")
        .replace(/(\*\*|__)/g, "")
        .trim(),
    )
    .filter((p) => p && !/^(notes?|nota|source|fonte)\s*:/i.test(p));
  const text = shorten(paragraphs.join(" ").trim(), max);
  // "sinopse" de uma palavra só (ou só pontuação) não ajuda ninguém
  return text.length >= 20 ? text : null;
}
