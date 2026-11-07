"use client";

// Gaveta de registro (vaul, MIT — a mesma base do Drawer do shadcn/ui).
// Abre de qualquer tela pelo botão + ou pelo "Registrar" do anime, sem trocar de página.
import { useSyncExternalStore } from "react";
import { Drawer } from "vaul";
import { t } from "@/messages";
import { LogForm } from "./LogForm";

type State = { open: boolean; animeId: string | null; key: number };
let state: State = { open: false, animeId: null, key: 0 };
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const CLOSED = state;

/** Abre a gaveta; com animeId, o passo 1 já vem preenchido. */
export function openLog(animeId: string | null = null) {
  // key nova = formulário zerado a cada abertura
  set({ open: true, animeId, key: state.key + 1 });
}

export function closeLog() {
  set({ open: false });
}

export function LogDrawer() {
  const s = useSyncExternalStore(subscribe, () => state, () => CLOSED);
  return (
    <Drawer.Root open={s.open} onOpenChange={(open) => set({ open })} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-2xl border border-b-0 border-line bg-bg outline-none"
          aria-describedby={undefined}
        >
          <Drawer.Handle className="mx-auto mt-3 mb-1 h-1.5 w-12 flex-none rounded-full bg-line" />
          <div className="overflow-y-auto px-4 pt-2" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
            <Drawer.Title className="mb-4 font-display text-2xl leading-none">{t.log.title}</Drawer.Title>
            {s.open && <LogForm key={s.key} presetId={s.animeId} onSaved={() => set({ open: false })} />}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
