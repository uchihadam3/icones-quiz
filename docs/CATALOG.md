# Catálogo e curadoria

**583 identidades** (Etapa 03), em `src/data/catalog/<categoria>.ts`, carregadas sob demanda (chunk
separado de ~14 KB gzip; a home só lê `src/data/catalog-summary.json`).

| Categoria | Total | Nível 1 | Nível 2 | Nível 3 |
|---|---|---|---|---|
| Anime | 65 | 4 | 37 | 24 |
| Desenhos | 74 | 24 | 42 | 8 |
| Animação (Disney/Pixar/DreamWorks…) | 65 | 27 | 36 | 2 |
| Games | 38 | 9 | 15 | 14 |
| Filmes e séries | 59 | 19 | 36 | 4 |
| Quadrinhos | 40 | 12 | 18 | 10 |
| Música | 103 | 58 | 45 | 0 |
| Esporte | 55 | 26 | 26 | 3 |
| Celebridades | 84 | 24 | 57 | 3 |
| **Total** | **583** | **203 (35%)** | **312 (54%)** | **68 (12%)** |

`npm run assets:report` gera esta tabela a partir do código.

## Níveis de fama

1. Universal/massivamente reconhecível. 2. Famoso para quem acompanha cultura pop.
3. Reconhecível dentro de uma obra/campo **popular** — nunca obscuro de fandom.
A dificuldade muda a **proporção** de níveis por rodada (ver GAME_RULES.md), nunca o critério de fama.

## Regras de entrada

- Só quem é reconhecível **por imagem**: nada de dubladores, figurantes ou aparências indistintas.
- Brasil e EUA fortes; ícones globais incluídos. Política e religião ficam de fora.
- **Ator × personagem**: não entram juntos um personagem live-action e o ator do papel icônico
  (ex.: Han Solo/Indiana Jones ⇒ sem Harrison Ford). Lista verificada em `catalog.test.ts`.
- Nomes PT-BR, original e inglês + apelidos; homônimos e apelidos ambíguos vão para `rejected`
  ("Ronaldo", "MJ", "Michael", "Woody" para o Pica-Pau, "Serena", "Vinícius", "Zelda" para o Link…).
- Nenhuma chave pertence a duas identidades; nenhum erro de 1 tecla sobre o nome de X é aceito para Y
  (testado contra o catálogo inteiro).
- Ids estáveis (kebab-case); nunca reaproveitar nem remover (use `active: false`).

## Limites da curadoria

A seleção e os níveis foram definidos por julgamento editorial sobre fama ampla e duradoura — não houve
métrica externa (buscas, audiência). Ajustes finos de nível podem vir de telemetria anônima de acerto
(ROADMAP, item 6).

## Como adicionar

1. Linha no arquivo da categoria: `['id', nível, 'Nome Exibido', 'Nome 1|Nome 2', 'Origem', 'Apelido', 'Rejeitado']`.
2. `npm run assets:sync` e `npm test` (colisões e regras são verificadas automaticamente).
