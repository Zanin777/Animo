# Supabase: banco e login

## Configurar (uma vez)

1. **Projeto:** supabase.com → New project (`aniora`, região South America / São Paulo).
2. **Chaves:** Project Settings → API Keys → copie a *Project URL* e a *publishable key* para o `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). A chave secreta não entra no app.
3. **Schema:** SQL Editor → cole `supabase/migrations/0001_core.sql` inteiro → Run.
4. **Catálogo:** SQL Editor → cole e rode, um de cada vez, `supabase/seed/anime-1.sql` … `anime-4.sql` (2.000 animes). Para regenerar depois de mudar o catálogo: `node tools/build-seed-sql.mjs`.
5. **Login:** Authentication → URL Configuration
   - Site URL: `http://localhost:3000` (em produção, o domínio do site)
   - Redirect URLs: `http://localhost:3000/auth/callback` (e o mesmo no domínio de produção)
6. Reinicie o `npm run dev` para ler as chaves novas.

## Como funciona

- **Login:** e-mail + senha (Supabase Auth). O cadastro manda um link de confirmação; o link cai em `/auth/callback`, que cria a sessão (cookies). `src/proxy.ts` renova a sessão a cada navegação.
- **Diário:** salva primeiro no navegador (rápido) e manda cada mudança ao banco por uma fila (`aniora:outbox:<id>`) que tenta de novo se a internet cair. Erros permanentes (ex.: anime que não existe no banco) são descartados para não travar a fila.
- **Primeiro login:** se a conta estiver vazia, o diário que estava no navegador é enviado para ela uma vez.
- **Segurança:** RLS em todas as tabelas — leitura pública (perfil, registros, listas públicas), escrita só do dono. O `@usuário` é único no banco; o trigger de cadastro nunca falha por causa dele (gera um alternativo).

## Atenção

- **E-mails no plano grátis:** o servidor de e-mail padrão do Supabase manda poucos e-mails por hora. Para as primeiras 20 pessoas, configure um SMTP próprio (Authentication → Emails → SMTP, ex.: Resend ou Brevo) antes de convidar gente.
- **Privacidade:** registros e perfis são públicos por padrão (estilo Letterboxd). Isso precisa estar claro no cadastro/termos antes de abrir para o público.
