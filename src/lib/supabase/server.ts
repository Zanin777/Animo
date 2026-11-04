import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/** Cliente para Route Handlers / Server Components (lê e grava os cookies da sessão). */
export async function getServerSupabase() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // chamado de um Server Component: o proxy já renova a sessão
        }
      },
    },
  });
}

/** Só aceita caminhos internos ("/perfil"), nunca "//site.com" ou URL completa. */
export function safeNext(next: string | null, fallback = "/") {
  return next && /^\/(?!\/)[\w\-/?=&#.%]*$/.test(next) ? next : fallback;
}
