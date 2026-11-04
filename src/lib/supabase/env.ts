// Chaves públicas do Supabase (podem ir para o navegador: quem protege os dados é o RLS).
// A chave secreta (service_role) NUNCA entra no app.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Sem as chaves o app funciona como antes, só no navegador (modo convidado). */
export const SUPABASE_ENABLED = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SUPABASE_URL) && SUPABASE_KEY.length > 20;
