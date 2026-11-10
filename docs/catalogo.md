# Catálogo: origem e análise de segurança

**Fonte:** [anime-offline-database](https://github.com/manami-project/anime-offline-database) (manami-project), release `2026-27` (dados de 2026-07-04).
**Licença:** ODbL 1.0 (base) + DbCL 1.0 (conteúdo), conferida no `LICENSE` da tag. Exige crédito (está no rodapé de /buscar) e, se um dia publicarmos a *base derivada*, que ela saia na mesma licença. Usar os dados dentro do app não obriga a abrir o código.

**Como atualizar:** baixar `anime-offline-database-minified.json` da release, trocar `tag` e `sha256` em `tools/import-catalog.mjs` e rodar
`node tools/import-catalog.mjs <arquivo.json> [--limit 6300]` (padrão 6.300 da base; com as temporadas extras do TMDB o total fica perto de 7 mil).

**Ordem completa (2026-11-10):** importar → `npm run covers` (ids do TMDB dos animes novos) → `npm run seasons` → `npm run fill-seasons` → importar de novo (saída final) → `node tools/build-seed-sql.mjs` → aplicar `supabase/seed/*.sql` no banco (o diário só aceita animes que existem na tabela `anime`).

O catálogo inteiro tem ~2,5 MB (~600 KB com gzip) e o navegador baixa uma vez nas páginas que buscam/listam animes. Se crescer muito mais, vale mover a busca para o banco.

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

## Capas (AniList)

Decisão de 2026-11-07: as capas vêm do AniList (`graphql.anilist.co`, grátis e sem chave). O id do AniList sai das `sources` do anime-offline-database, então não há casamento por título.

- **Rodar:** o próprio `import-catalog.mjs` busca as capas que faltam (50 por requisição, ~30 req/min) e guarda o cache em `tools/anilist-covers.json` (`{ anilistId: "/arquivo.jpg" | null }`).
- **O que guardamos:** só o nome do arquivo da capa `extraLarge`, validado por regex; o app monta `s4.anilist.co/file/anilistcdn/media/anime/cover/large/<arquivo>`. `next.config.ts` só aceita esse caminho.
- **Temporadas extras** (vindas do TMDB) usam a capa da série.
- **Termos:** uso comercial (Premium, anúncios) pede autorização do AniList antes.
- O TMDB continua só para ids, temporadas e episódios (seção abaixo).

## TMDB (histórico: era a fonte das capas até 2026-11-07)

Decisão de 2026-11-04: capa oficial do TMDB onde houver; o pôster tipográfico da direção de arte continua como reserva (sem capa, ou se a imagem falhar).

- **Termos:** API grátis para uso **não comercial**, com crédito (texto no rodapé de /buscar + **logo do TMDB, ainda a adicionar** a partir dos arquivos oficiais deles) e o aviso "não é endossado nem certificado pelo TMDB". **Premium, anúncios ou qualquer receita exigem contrato escrito com o TMDB antes.** ([termos](https://www.themoviedb.org/api-terms-of-use))
- **Chave:** só em `.env.local` (ignorado pelo Git), usada só pelo script `tools/fetch-covers.mjs`. Nunca vai para o navegador.
- **O que guardamos:** só o caminho do pôster (ex.: `/abc123.jpg`), validado por regex no script, no app (`Poster.tsx`) e no banco (`check` em `anime.cover_path`).
- **Privacidade:** as imagens passam pelo otimizador do Next (`/_next/image`), então o navegador do usuário não fala direto com o TMDB. `next.config.ts` só aceita `image.tmdb.org/t/p/w342/**`, sem redirecionamentos.
- **Custo:** na Vercel, a otimização de imagens tem cota no plano grátis; com cache de 31 dias deve sobrar para o primeiro marco, mas vale acompanhar.
- **Limitação:** o TMDB agrupa temporadas numa série só, então "Season 2" usa a capa da série.

Rodar: `npm run covers` (e `npm run covers -- --retry` para tentar de novo quem não foi achado).

## Temporadas e episódios (TMDB)

- `npm run seasons` (depois de `covers`) descobre a temporada do TMDB de cada série: mesmo ano de estreia, senão o mais próximo; empate → nº de episódios mais próximo. Quando vários animes do catálogo caem na mesma temporada (ex.: *Spy x Family* e *Part 2*; *Jujutsu Kaisen* inteiro numa temporada só), os episódios são divididos em ordem de lançamento. Também troca a capa pela **capa da temporada**. Cache em `tools/tmdb-seasons.json`.
- A lista de episódios (nome em pt-BR, imagem, data, duração) **não fica no repositório**: a rota `/api/episodes/[id]` busca no TMDB sob demanda, com cache de semanas (`'use cache'` + `cacheLife('weeks')`). Só aceita ids do catálogo; o que vem do TMDB é validado (texto limpo, imagem só como caminho `/xxx.jpg`).
- **Em produção (Vercel)** é preciso cadastrar `TMDB_READ_TOKEN` nas variáveis de ambiente do projeto. Sem ele, os episódios aparecem só numerados.
- A nota de cada episódio fica no diário (`episodeRatings`); quando houver banco, vira uma tabela `episode_ratings`.

## Sinopse (2026-11-09)

Cada página de anime mostra uma sinopse curta. Ela **não fica no repositório nem no banco**: a rota `/api/synopsis/[id]` busca sob demanda e guarda em cache por semanas (mesmo padrão dos episódios).

- **Ordem das fontes:** 1º TMDB em **português** (precisa do `TMDB_READ_TOKEN` e de o anime ter id do TMDB); 2º AniList, **em inglês** (o AniList não tem sinopse em português). A tela diz de onde veio e, quando é o caso, que está em inglês.
- **Sem o `TMDB_READ_TOKEN` na Vercel, toda sinopse sai em inglês.**
- **Id do AniList:** `import-catalog.mjs` grava `src/lib/catalog/anilist-ids.generated.json` (`{ idDoAnime: idDoAniList }`). Esse arquivo é lido **só no servidor**; o catálogo que o navegador baixa continua sem ele. Temporadas extras usam o id da série.
- **Segurança:** a rota só aceita ids do catálogo (nada do que o visitante digita vai para o TMDB/AniList). O texto passa por `cleanSynopsis` (`src/lib/synopsis/clean.ts`): tira tags, spoilers `~!…!~`, crédito "(Source: …)", caracteres de controle e de direção, e corta em ~700 caracteres no fim de uma frase. Na tela entra como texto do React, nunca como HTML.
- **Por que sob demanda:** os termos do AniList proíbem copiar a base em massa, e os do TMDB limitam o tempo de cache. Buscar uma sinopse quando alguém abre a página e guardar por semanas respeita os dois.
- **Limite:** o AniList aceita ~30 requisições por minuto. Com o cache isso só importaria com muita gente abrindo, ao mesmo tempo, animes que ninguém abriu antes; nesse caso a sinopse simplesmente não aparece e a próxima visita tenta de novo.
