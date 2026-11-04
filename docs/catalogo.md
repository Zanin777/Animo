# Catálogo: origem e análise de segurança

**Fonte:** [anime-offline-database](https://github.com/manami-project/anime-offline-database) (manami-project), release `2026-27` (dados de 2026-07-04).
**Licença:** ODbL 1.0 (base) + DbCL 1.0 (conteúdo), conferida no `LICENSE` da tag. Exige crédito (está no rodapé de /buscar) e, se um dia publicarmos a *base derivada*, que ela saia na mesma licença. Usar os dados dentro do app não obriga a abrir o código.

**Como atualizar:** baixar `anime-offline-database-minified.json` da release, trocar `tag` e `sha256` em `tools/import-catalog.mjs` e rodar
`node tools/import-catalog.mjs <arquivo.json> [--limit 500]`.

## Análise de segurança (2026-11-04)

O que usamos do repositório é **um arquivo JSON**, só lido com `JSON.parse`. Nenhum código de lá roda aqui (o repo tem `makefile` e workflows do GitHub; não usamos).

| Verificado | Resultado |
| --- | --- |
| Integridade | SHA-256 do arquivo fixado no script; se mudar, a importação para |
| Repositório | **Arquivado** pelo autor: sem novas versões. Risco de alguém trocar o arquivo é baixo, mas o catálogo não vai receber animes novos por essa fonte |
| Scripts / `javascript:` / `data:` / handlers `on*=` | 0 ocorrências em 41.537 animes |
| Chaves `__proto__` / `constructor` (prototype pollution) | 0 |
| Caracteres de controle e zero-width | 0 |
| Caracteres de direção (bidi, U+202A–202E, U+2066–2069) | 18 sinônimos (árabe, hebraico, tailandês). Legítimos, mas permitem texto enganoso na tela → **removidos na importação** |
| Texto com `<` `>` | 19 títulos/sinônimos legítimos (ex.: `Bogus Skill <<fruitmaster>>`). Inofensivos porque o React escapa texto → **regra: nunca usar `dangerouslySetInnerHTML` com dados do catálogo** |
| Tamanho | maior título 232 caracteres (schema aceita 200) e até 124 sinônimos num anime → **a importação descarta títulos > 200 e guarda no máximo ~8 apelidos ≤ 100 caracteres** |
| URLs | todas `https`, mas apontam para MyAnimeList, AniList etc. → **não guardamos URLs nem imagens** (termos de terceiros e privacidade: imagem externa vaza o IP do usuário para esses sites) |
| Números | ano fora de 1910–2100 e episódios fora de 1–5000 viram `null`; em exibição, episódios = `null` |

A importação valida cada item no fim; se algum fugir das regras, nada é gravado.

## Capas (TMDB)

Decisão de 2026-11-04: capa oficial do TMDB onde houver; o pôster tipográfico da direção de arte continua como reserva (sem capa, ou se a imagem falhar).

- **Termos:** API grátis para uso **não comercial**, com crédito (texto no rodapé de /buscar + **logo do TMDB, ainda a adicionar** a partir dos arquivos oficiais deles) e o aviso "não é endossado nem certificado pelo TMDB". **Premium, anúncios ou qualquer receita exigem contrato escrito com o TMDB antes.** ([termos](https://www.themoviedb.org/api-terms-of-use))
- **Chave:** só em `.env.local` (ignorado pelo Git), usada só pelo script `tools/fetch-covers.mjs`. Nunca vai para o navegador.
- **O que guardamos:** só o caminho do pôster (ex.: `/abc123.jpg`), validado por regex no script, no app (`Poster.tsx`) e no banco (`check` em `anime.cover_path`).
- **Privacidade:** as imagens passam pelo otimizador do Next (`/_next/image`), então o navegador do usuário não fala direto com o TMDB. `next.config.ts` só aceita `image.tmdb.org/t/p/w342/**`, sem redirecionamentos.
- **Custo:** na Vercel, a otimização de imagens tem cota no plano grátis; com cache de 31 dias deve sobrar para o primeiro marco, mas vale acompanhar.
- **Limitação:** o TMDB agrupa temporadas numa série só, então "Season 2" usa a capa da série.

Rodar: `npm run covers` (e `npm run covers -- --retry` para tentar de novo quem não foi achado).
