import { rowToProfile } from "@/lib/diary/remote";
import { isPremium, type LocalProfile } from "@/lib/diary/types";

export type Review = {
  id: string;
  ratingHalf: number | null;
  text: string;
  watchedOn: string;
  createdAt: string;
  author: LocalProfile;
  premium: boolean;
};

type Row = Record<string, unknown>;

/** Linhas de entries (+ profiles embutido) → reviews, com Premium primeiro e depois as mais novas. */
export function rankReviews(rows: Row[]): Review[] {
  return rows
    .map((r) => {
      const author = rowToProfile((r.profiles as Row | null) ?? null);
      return {
        id: r.id as string,
        ratingHalf: (r.rating_half as number | null) ?? null,
        text: ((r.review as string | null) ?? "").trim(),
        watchedOn: r.watched_on as string,
        createdAt: r.created_at as string,
        author,
        premium: isPremium(author.role),
      };
    })
    .filter((r) => r.text.length > 0)
    .sort((a, b) => Number(b.premium) - Number(a.premium) || b.createdAt.localeCompare(a.createdAt));
}
