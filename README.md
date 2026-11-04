# aniora.

Diário de anime estilo Letterboxd, em PT-BR.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # testes (Vitest)
npm run typecheck
npm run lint
```

## Estado atual

- Front-end completo do núcleo: Início, Buscar, Registrar (3 toques), página do anime, Listas, Perfil.
- **Dados só no navegador** (localStorage, `src/lib/diary/store.ts`). Sem contas ainda.
- Banco e segurança (Supabase + RLS) vêm depois: o schema já está em `supabase/migrations/0001_core.sql`.

## Créditos de terceiros

- Catálogo: [anime-offline-database](https://github.com/manami-project/anime-offline-database), ODbL 1.0 + DbCL 1.0 (ver `docs/catalogo.md`)
- Capas: [TMDB](https://www.themoviedb.org), uso não comercial. Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
- `src/components/SlidingNumber.tsx`: adaptado do [Motion Primitives](https://github.com/ibelick/motion-primitives), MIT (`third-party/motion-primitives.LICENSE.md`)
- Gaveta de registro: [vaul](https://github.com/emilkowalski/vaul), MIT (dependência npm)

## Mapa

| Onde | O quê |
| --- | --- |
| `docs/estilo.html` | Direção de arte aprovada (referência visual) |
| `src/app/tokens.css` | Cores e fontes — iguais à página de estilo |
| `src/messages/pt-BR.ts` | Todos os textos da interface |
| `src/lib/catalog/` | `AnimeCatalogProvider` + catálogo inicial (`seed.ts`) |
| `src/lib/diary/ops.ts` | Regras do diário (funções puras, testadas) |
| `src/lib/diary/store.ts` | Armazenamento local — o que vira Supabase depois |
| `src/components/` | Pôster tipográfico, selo hanko, estrelas, navegação |
