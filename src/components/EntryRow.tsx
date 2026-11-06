import Link from "next/link";
import type { Anime } from "@/lib/catalog/provider";
import type { Entry } from "@/lib/diary/types";
import { formatDate, t } from "@/messages";
import { Hanko } from "./Hanko";
import { Poster } from "./Poster";
import { tag } from "./ui";

export function EntryRow({ entry, anime, showTitle = true }: { entry: Entry; anime: Anime; showTitle?: boolean }) {
  return (
    <Link
      href={`/anime/${anime.id}`}
      className="grid grid-cols-[44px_1fr_auto] items-center gap-3.5 py-3 transition-colors hover:bg-card sm:grid-cols-[52px_1fr_auto]"
    >
      <Poster anime={anime} size="xs" />
      <div className="min-w-0">
        {showTitle && (
          <h3 className="truncate text-base font-bold">
            {anime.title}
            {entry.isRewatch && (
              <span className={`ml-1.5 align-[2px] font-normal ${tag}`}>
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
