"use client";

// Gaveta para escolher um anime (favorito, anime em destaque). Mesma base da gaveta de registro.
import { Drawer } from "vaul";
import type { Anime } from "@/lib/catalog/provider";
import { AnimeSearch } from "./AnimeSearch";
import { Poster } from "./Poster";

export function AnimePicker({
  open,
  title,
  onClose,
  onPick,
  exclude = [],
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onPick: (anime: Anime) => void;
  /** ids que não aparecem (ex.: já são favoritos) */
  exclude?: string[];
}) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-xl flex-col rounded-t-2xl border border-b-0 border-line bg-bg outline-none"
          aria-describedby={undefined}
        >
          <Drawer.Handle className="mx-auto mt-3 mb-1 h-1.5 w-12 flex-none rounded-full bg-line" />
          {/* o React propaga submit por portais: não deixar chegar num <form> de fora */}
          <div
            className="min-h-[50dvh] overflow-y-auto px-4 pt-2"
            style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
            onSubmit={(e) => e.stopPropagation()}
          >
            <Drawer.Title className="mb-4 font-display text-2xl leading-none">{title}</Drawer.Title>
            {open && (
              <AnimeSearch
                autoFocus
                onPick={onPick}
                render={(results) => (
                  <ul className="grid gap-0.5">
                    {results
                      .filter((a) => !exclude.includes(a.id))
                      .slice(0, 12)
                      .map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => onPick(a)}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-md p-1.5 text-left transition-colors hover:bg-card"
                          >
                            <Poster anime={a} size="xs" className="w-9 flex-none" />
                            <span className="min-w-0 flex-1 truncate">{a.title}</span>
                            <span className="text-sm text-muted tabular-nums">{a.year}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              />
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
