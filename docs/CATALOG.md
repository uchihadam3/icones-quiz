# Catálogo e curadoria

**1.492 identidades** (Etapa 04; eram 583 na Etapa 03), em `src/data/catalog/<categoria>.ts`, carregadas
sob demanda (chunk separado de ~35 KB gzip; a home só lê `src/data/catalog-summary.json`).

| Categoria | Total | Nível 1 | Nível 2 | Nível 3 |
|---|---|---|---|---|
| Anime | 207 | 4 | 132 | 71 |
| Desenhos | 218 | 28 | 142 | 48 |
| Animação (Disney/Pixar/DreamWorks…) | 170 | 29 | 105 | 36 |
| Games | 131 | 11 | 66 | 54 |
| Filmes e séries | 143 | 24 | 105 | 14 |
| Quadrinhos | 94 | 12 | 45 | 37 |
| Música | 221 | 69 | 151 | 1 |
| Esporte | 127 | 26 | 97 | 4 |
| Celebridades | 181 | 24 | 154 | 3 |
| **Total** | **1.492** | **227 (15%)** | **997 (67%)** | **268 (18%)** |

## Auditoria

- `npm run catalog:report` — totais, novos desde a linha de base (`reports/catalog-baseline.json`),
  níveis, ready/missing, franquias mais frequentes, nomes a 1 edição para revisão e a **fila de imagens
  priorizada** (missing, nível 1 → 3, alternando categorias). `-- --write` grava
  `reports/catalog-report.json` e `.md` (fora do bundle: o jogo nunca mostra respostas).
- `npm run assets:report` — estado das imagens e do desbloqueio do modo competitivo.
- `npm run assets:sync` — acrescenta só ids novos (`missing`) no **fim** do manifesto; nunca altera,
  reordena ou apaga entradas existentes (testado em `src/data/catalog-sync.test.ts`).

## Níveis de fama

1. Universal/massivamente reconhecível. 2. Famoso para quem acompanha cultura pop.
3. Reconhecível dentro de uma obra/campo **popular** — nunca obscuro de fandom.
A dificuldade muda a **proporção** de níveis por rodada (ver GAME_RULES.md), nunca o critério de fama.

## Regras de entrada

- Só quem é reconhecível **por imagem**: nada de dubladores, figurantes ou aparências indistintas.
- Brasil e EUA fortes; ícones globais incluídos. Política e religião ficam de fora.
- **Ator × personagem**: não entram juntos um personagem live-action e o ator do papel icônico
  (ex.: Han Solo/Indiana Jones ⇒ sem Harrison Ford; Cillian Murphy ⇒ sem Thomas Shelby). Lista
  verificada em `catalog.test.ts`.
- **Nomes naturais**: personagens aceitam a forma curta pela qual o público os chama quando ela é
  inequívoca ("Naruto", "Gojo", "Lara", "Snake"); pessoas reais só nomes artísticos/apelidos
  independentes (nunca "Jim", "Jennifer", "Michael" sozinhos).
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
