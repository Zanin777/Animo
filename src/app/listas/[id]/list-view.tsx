"use client";

import { useParams, useRouter } from "next/navigation";
import { Muted, PageTitle, PosterGrid, AnimeTile, btnGhost } from "@/components/ui";
import { useCatalog } from "@/lib/catalog/local";
import { diary, useDiary } from "@/lib/diary/store";
import { t } from "@/messages";

export function ListView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lists } = useDiary();
  const catalog = useCatalog();
  const list = lists.find((l) => l.id === id);

  if (!list) return <Muted>{t.lists.empty}</Muted>;

  return (
    <>
      <PageTitle
        aside={
          <button
            type="button"
            className={`${btnGhost} text-muted`}
            onClick={() => {
              if (!confirm(t.lists.confirmDeleteList)) return;
              diary.deleteList(list.id);
              router.push("/listas");
            }}
          >
            {t.lists.deleteList}
          </button>
        }
      >
        {list.title}
      </PageTitle>
      {list.description && <p className="-mt-3 mb-6 max-w-prose text-muted">{list.description}</p>}

      {list.items.length === 0 ? (
        <Muted>{t.lists.emptyList}</Muted>
      ) : (
        <PosterGrid>
          {list.items.map((i) => {
            const a = catalog.get(i.animeId);
            if (!a) return null;
            return (
              <div key={i.animeId} className="relative">
                {list.isRanked && (
                  <span className="absolute -top-2 -left-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-accent font-display text-xs text-white">
                    {i.position}
                  </span>
                )}
                <AnimeTile
                  anime={a}
                  caption={
                    <button
                      type="button"
                      className="cursor-pointer hover:text-accent"
                      onClick={(e) => {
                        e.preventDefault();
                        diary.removeFromList(list.id, a.id);
                      }}
                    >
                      {t.lists.remove}
                    </button>
                  }
                />
              </div>
            );
          })}
        </PosterGrid>
      )}
    </>
  );
}
