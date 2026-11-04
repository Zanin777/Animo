import Link from "next/link";
import type { Anime } from "@/lib/catalog/provider";
import type { Entry } from "@/lib/diary/types";
import { formatDate, t } from "@/messages";
import { Hanko } from "./Hanko";
import { Poster } from "./Poster";

export function EntryRow({ entry, anime, showTitle = true }: { entry: Entry; anime: Anime; showTitle?: boolean }) {
  return (
    <Link
      href={`/anime/${anime.id}`}
      className="grid grid-cols-[48px_1fr_auto] items-center gap-3.5 rounded-xl border border-line bg-card p-3 sm:grid-cols-[64px_1fr_auto]"
    >
      <Poster anime={anime} size="xs" />
      <div className="min-w-0">
        {showTitle && (
          <h3 className="truncate text-base font-bold">
            {anime.title}
            {entry.isRewatch && (
              <span className="ml-1.5 inline-block rounded-full border border-line px-2 align-[2px] text-[11px] font-normal text-muted">
                {t.entry.rewatch}
              </span>
            )}
          </h3>
        )}
        <p className="line-clamp-2 text-sm text-muted">
          {formatDate(entry.watchedOn)}
          {!showTitle && entry.isRewatch && ` · ${t.entry.rewatch}`}
          {entry.review && ` · ${entry.review}`}
        </p>
      </div>
      {entry.ratingHalf !== null ? <Hanko half={entry.ratingHalf} /> : <span />}
    </Link>
  );
}
