// DADOS DE DEMONSTRAÇÃO — inventados, determinísticos, só em desenvolvimento.
// Existem para ver o layout do Início enquanto não há banco. Os animes são do
// catálogo real; pessoas, notas, reviews e listas são fictícias.
// Some quando o Supabase entrar (ver community/index.ts).
import type { Anime } from "@/lib/catalog/provider";
import type { CommunityEvent, CommunitySnapshot, PublicList } from "./types";

// Apelidos fictícios (não são pessoas reais).
export const DEMO_USERS = [
  "tsuki_no_neko", "ramen.critico", "otaku_paulista", "maho_shoujo_br", "kaze88",
  "lia.anima", "bento_box", "nekomancer", "shounen_sensei", "hanabi.lua", "mecha_dad", "yuzu_tea",
];
export const DEMO_FOLLOWING = DEMO_USERS.slice(0, 4);

const REVIEWS = [
  "Terminei e fiquei olhando para o teto por meia hora.",
  "A trilha sonora carrega metade do anime, e tudo bem.",
  "Começa devagar, mas o último arco compensa tudo.",
  "Revi depois de anos e continua perfeito.",
  "Animação absurda. A história não acompanha.",
  "Chorei no episódio 7 e não me arrependo.",
  "Comédia que funciona até na terceira revisão.",
  "Não era para mim, mas entendo quem ama.",
];

/** PRNG determinístico (mulberry32): mesma semente, mesmos dados. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildDemoSnapshot(catalog: Anime[], featuredIds: string[]): CommunitySnapshot {
  const rand = rng(20261104);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const byId = new Map(catalog.map((a) => [a.id, a]));

  // popularidade inventada: destaques pesam muito, o resto é cauda longa
  const featured = featuredIds.filter((id) => byId.has(id));
  const tail = catalog.filter((_, i) => i % 7 === 0).map((a) => a.id);
  const quality = new Map<string, number>(); // "nota verdadeira" de cada anime, 6..10
  const qOf = (id: string) => {
    if (!quality.has(id)) quality.set(id, 6 + Math.floor(rand() * 5));
    return quality.get(id)!;
  };

  const events: CommunityEvent[] = [];
  for (let i = 0; i < 900; i++) {
    const animeId = rand() < 0.55 ? pick(featured) : pick(tail);
    const q = qOf(animeId);
    const r = rand();
    const ratingHalf = r < 0.12 ? null : Math.max(1, Math.min(10, q + Math.round((rand() - 0.5) * 4)));
    events.push({
      user: pick(DEMO_USERS),
      animeId,
      ratingHalf,
      review: rand() < 0.15 ? pick(REVIEWS) : null,
      // mais registros recentes do que antigos
      minutesAgo: Math.floor(rand() ** 2 * 30 * 24 * 60) + 3,
    });
  }

  const has = (a: Anime, ...g: string[]) => g.some((x) => a.genres.includes(x));
  const take = (pred: (a: Anime) => boolean, n: number) => catalog.filter(pred).slice(0, n).map((a) => a.id);
  const lists: PublicList[] = [
    { id: "demo-suspense", title: "10 animes para quem ama suspense", author: "nekomancer", animeIds: take((a) => has(a, "mystery", "thriller", "psychological") && a.kind === "tv", 10), likes: 214, minutesAgo: 95 },
    { id: "demo-finais", title: "Animes com finais inesquecíveis", author: "lia.anima", animeIds: ["fma-brotherhood", "cowboy-bebop", "steins-gate", "violet-evergarden", "clannad-after-story", "gurren-lagann"].filter((id) => byId.has(id)), likes: 388, minutesAgo: 60 * 20 },
    { id: "demo-merecem", title: "Obras que merecem mais reconhecimento", author: "ramen.critico", animeIds: ["ping-pong", "odd-taxi", "mononoke-2007", "mushishi", ...tail.slice(3, 7)].filter((id) => byId.has(id)), likes: 152, minutesAgo: 60 * 50 },
    { id: "demo-conforto", title: "Para assistir de coberta num domingo", author: "yuzu_tea", animeIds: take((a) => has(a, "slice-of-life") && has(a, "comedy"), 8), likes: 97, minutesAgo: 60 * 72 },
  ];

  return { demo: true, events, following: DEMO_FOLLOWING, lists };
}
