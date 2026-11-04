// Agregações puras sobre os registros da comunidade. No Supabase, as mesmas
// regras viram SQL (view/materialized view); aqui servem para demo e testes.
import type { ActivityItem, AnimeStat, CommunityEvent, CommunitySnapshot, EpisodeEvent, EpisodeStat } from "./types";

const WEEK = 7 * 24 * 60;
/** "Recomenda" = nota 4 estrelas ou mais. */
export const RECOMMEND_MIN_HALF = 8;
/** Mínimo de notas para entrar no Top (evita 1 nota 5 no topo). */
export const TOP_MIN_RATINGS = 5;

export function statsByAnime(events: CommunityEvent[]): Map<string, AnimeStat> {
  const acc = new Map<string, { sum: number; ratings: number; users: Set<string>; recent: number }>();
  for (const e of events) {
    let a = acc.get(e.animeId);
    if (!a) acc.set(e.animeId, (a = { sum: 0, ratings: 0, users: new Set(), recent: 0 }));
    a.users.add(e.user);
    if (e.ratingHalf !== null) {
      a.sum += e.ratingHalf;
      a.ratings++;
    }
    if (e.minutesAgo <= WEEK) a.recent++;
  }
  const out = new Map<string, AnimeStat>();
  for (const [animeId, a] of acc) {
    out.set(animeId, {
      animeId,
      avgHalf: a.ratings ? a.sum / a.ratings : null,
      ratings: a.ratings,
      watchers: a.users.size,
      recent: a.recent,
    });
  }
  return out;
}

/** Em alta: mais atividade na semana; empate → mais notas. */
export function trending(events: CommunityEvent[], limit = 12): AnimeStat[] {
  return [...statsByAnime(events).values()]
    .filter((s) => s.recent > 0)
    .sort((a, b) => b.recent - a.recent || b.ratings - a.ratings)
    .slice(0, limit);
}

export type FriendStat = AnimeStat & { friendsWhoRecommend: number };

/** Entre amigos: só o que quem você segue registrou e recomendou (nota ≥ 4). */
export function trendingAmongFriends(events: CommunityEvent[], following: string[], limit = 12): FriendStat[] {
  const f = new Set(following);
  const recommended = events.filter((e) => f.has(e.user) && e.ratingHalf !== null && e.ratingHalf >= RECOMMEND_MIN_HALF);
  const byAnime = statsByAnime(recommended);
  // a nota mostrada no card continua sendo a da comunidade toda
  const all = statsByAnime(events);
  return [...byAnime.values()]
    .sort((a, b) => b.watchers - a.watchers || b.recent - a.recent)
    .slice(0, limit)
    .map((s) => ({ ...all.get(s.animeId)!, friendsWhoRecommend: s.watchers }));
}

export function topRated(events: CommunityEvent[], limit = 10, minRatings = TOP_MIN_RATINGS): AnimeStat[] {
  return [...statsByAnime(events).values()]
    .filter((s) => s.avgHalf !== null && s.ratings >= minRatings)
    .sort((a, b) => b.avgHalf! - a.avgHalf! || b.ratings - a.ratings)
    .slice(0, limit);
}

export function mostWatched(events: CommunityEvent[], limit = 10): AnimeStat[] {
  return [...statsByAnime(events).values()].sort((a, b) => b.watchers - a.watchers || b.ratings - a.ratings).slice(0, limit);
}

/** Mínimo de notas para um episódio entrar no Top Episódios. */
export const TOP_EPISODE_MIN_RATINGS = 3;

export function statsByEpisode(events: EpisodeEvent[]): EpisodeStat[] {
  const acc = new Map<string, { animeId: string; episode: number; sum: number; ratings: number; users: Set<string> }>();
  for (const e of events) {
    const k = `${e.animeId}#${e.episode}`;
    let a = acc.get(k);
    if (!a) acc.set(k, (a = { animeId: e.animeId, episode: e.episode, sum: 0, ratings: 0, users: new Set() }));
    a.users.add(e.user);
    if (e.ratingHalf !== null) {
      a.sum += e.ratingHalf;
      a.ratings++;
    }
  }
  return [...acc.values()].map((a) => ({
    animeId: a.animeId,
    episode: a.episode,
    avgHalf: a.ratings ? a.sum / a.ratings : null,
    ratings: a.ratings,
    watchers: a.users.size,
  }));
}

export function topEpisodes(events: EpisodeEvent[], limit = 10, minRatings = TOP_EPISODE_MIN_RATINGS): EpisodeStat[] {
  return statsByEpisode(events)
    .filter((s) => s.avgHalf !== null && s.ratings >= minRatings)
    .sort((a, b) => b.avgHalf! - a.avgHalf! || b.ratings - a.ratings)
    .slice(0, limit);
}

export function mostWatchedEpisodes(events: EpisodeEvent[], limit = 10): EpisodeStat[] {
  return statsByEpisode(events)
    .sort((a, b) => b.watchers - a.watchers || b.ratings - a.ratings || a.episode - b.episode)
    .slice(0, limit);
}

/** Prévia do feed: conclusões, notas, reviews e listas, do mais novo ao mais antigo. */
export function activity(snap: CommunitySnapshot, limit = 8): ActivityItem[] {
  const items: ActivityItem[] = snap.events.map((e) =>
    e.review
      ? { kind: "reviewed", user: e.user, animeId: e.animeId, ratingHalf: e.ratingHalf, review: e.review, minutesAgo: e.minutesAgo }
      : e.ratingHalf !== null
        ? { kind: "rated", user: e.user, animeId: e.animeId, ratingHalf: e.ratingHalf, minutesAgo: e.minutesAgo }
        : { kind: "completed", user: e.user, animeId: e.animeId, minutesAgo: e.minutesAgo },
  );
  for (const l of snap.lists) items.push({ kind: "list", user: l.author, listId: l.id, listTitle: l.title, minutesAgo: l.minutesAgo });
  return items.sort((a, b) => a.minutesAgo - b.minutesAgo).slice(0, limit);
}
