"use client";

import { useSyncExternalStore } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { SUPABASE_ENABLED } from "@/lib/supabase/env";

export type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; userId: string; email: string | null };

const LOADING: AuthState = { status: "loading" };
const GUEST: AuthState = { status: "guest" };

let state: AuthState = SUPABASE_ENABLED ? LOADING : GUEST;
let started = false;
const listeners = new Set<() => void>();
const set = (next: AuthState) => {
  state = next;
  listeners.forEach((l) => l());
};

function start() {
  if (started) return;
  started = true;
  const sb = getSupabase();
  if (!sb) return set(GUEST);
  sb.auth.onAuthStateChange((_event, session) => {
    const u = session?.user;
    const next: AuthState = u ? { status: "user", userId: u.id, email: u.email ?? null } : GUEST;
    // só avisa quando muda de verdade (evento de token renovado não troca o usuário)
    if (next.status !== state.status || (next.status === "user" && state.status === "user" && next.userId !== state.userId)) set(next);
  });
}

function subscribe(l: () => void) {
  start();
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, () => state, () => LOADING);
}

/** Para quem não é componente (o store do diário). */
export function onAuth(l: (s: AuthState) => void) {
  start();
  const fn = () => l(state);
  listeners.add(fn);
  fn();
  return () => listeners.delete(fn);
}

/** Mensagens do Supabase Auth em PT-BR (as mais comuns). */
export function authErrorMessage(code: string | undefined, message: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar (veja sua caixa de entrada).";
    case "user_already_exists":
    case "email_exists":
      return "Já existe uma conta com esse e-mail.";
    case "weak_password":
      return "Senha fraca: use pelo menos 8 caracteres, misturando letras e números.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas. Espere alguns minutos e tente de novo.";
    case "signup_disabled":
      return "Cadastros estão fechados no momento.";
    default:
      return message ? `Não deu certo: ${message}` : "Não deu certo. Tente de novo.";
  }
}
