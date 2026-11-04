"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authErrorMessage, useAuth } from "@/lib/auth";
import { HANDLE_RE } from "@/lib/diary/types";
import { getSupabase } from "@/lib/supabase/client";
import { t } from "@/messages";
import { Muted, PageTitle, btnPrimary, card, input } from "./ui";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();
  const sb = getSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("erro") === "link" ? t.auth.linkError : null);
  const [sent, setSent] = useState(false);
  const signup = mode === "signup";

  if (!sb) {
    return (
      <>
        <PageTitle>{signup ? t.auth.signupTitle : t.auth.signinTitle}</PageTitle>
        <Muted>{t.auth.notConfigured}</Muted>
      </>
    );
  }
  if (auth.status === "user") {
    return (
      <>
        <PageTitle>{t.auth.signinTitle}</PageTitle>
        <p className="mb-4">{t.auth.already(auth.email ?? "")}</p>
        <Link href="/perfil" className={btnPrimary}>
          {t.nav.profile}
        </Link>
      </>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sb) return;
    setError(null);
    if (signup && !HANDLE_RE.test(username)) return setError(t.profile.errHandle);
    if (signup && password.length < 8) return setError(t.auth.passwordShort);
    setBusy(true);
    if (signup) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: displayName.trim().slice(0, 50) },
          emailRedirectTo: `${location.origin}/auth/callback?next=/perfil`,
        },
      });
      setBusy(false);
      if (error) return setError(authErrorMessage(error.code, error.message));
      // com confirmação de e-mail ligada não vem sessão: avisa para checar a caixa
      if (!data.session) return setSent(true);
      router.push("/perfil");
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(authErrorMessage(error.code, error.message));
      router.push("/perfil");
    }
  }

  if (sent) {
    return (
      <>
        <PageTitle>{t.auth.checkEmailTitle}</PageTitle>
        <p className="max-w-prose">{t.auth.checkEmail(email)}</p>
      </>
    );
  }

  return (
    <>
      <PageTitle>{signup ? t.auth.signupTitle : t.auth.signinTitle}</PageTitle>
      <form onSubmit={submit} className={`${card} grid max-w-md gap-3 p-5`}>
        {signup && (
          <>
            <label className="grid gap-1 text-sm">
              {t.profile.fieldName}
              <input className={input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} autoComplete="nickname" />
            </label>
            <label className="grid gap-1 text-sm">
              {t.profile.fieldHandle}
              <div className="flex items-center gap-1">
                <span className="text-muted">@</span>
                <input
                  className={input}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  maxLength={20}
                  required
                  pattern="[a-z0-9_]{3,20}"
                  autoComplete="username"
                />
              </div>
              <span className="text-xs text-muted">{t.profile.handleHint}</span>
            </label>
          </>
        )}
        <label className="grid gap-1 text-sm">
          {t.auth.email}
          <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="grid gap-1 text-sm">
          {t.auth.password}
          <input
            className={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={signup ? 8 : undefined}
            autoComplete={signup ? "new-password" : "current-password"}
          />
        </label>
        {error && (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={btnPrimary} disabled={busy}>
          {busy ? "…" : signup ? t.auth.signupCta : t.auth.signinCta}
        </button>
        <p className="text-sm text-muted">
          {signup ? t.auth.haveAccount : t.auth.noAccount}{" "}
          <Link href={signup ? "/entrar" : "/cadastro"} className="text-accent underline">
            {signup ? t.auth.signinCta : t.auth.signupCta}
          </Link>
        </p>
      </form>
      {signup && <Muted className="mt-3 max-w-md text-xs">{t.auth.importNotice}</Muted>}
    </>
  );
}
