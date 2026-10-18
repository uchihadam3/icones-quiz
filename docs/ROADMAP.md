# Roadmap

## ✅ Etapa 01 — vertical slice (atual)

- Motor puro com vidas, recuperação, combo, pulos/ajudas, timer justo e seleção com RNG injetável.
- Validação de respostas com normalização, apelidos, tolerância a erro e proteção contra homônimos.
- Catálogo inicial curado (89 ícones) + manifesto de imagens (todas `missing`).
- Interface mobile-first com GSAP, movimento reduzido e teclado; preview de desenvolvimento.
- CI (lint, typecheck, unitários, validação de assets, build, E2E 360px/desktop) e deploy no Pages.

## 2 — Pacote de imagens (com o Codex)

- Seguir `docs/IMAGE_INTEGRATION.md`: obter imagens com licença, converter para WebP 4:5, preencher o
  manifesto (`ready` + fonte, autor, licença, atribuição).
- Página de **créditos** listando a atribuição de cada imagem.
- Começar pelas pessoas reais com fotos livres no Wikimedia Commons; personagens protegidos só com
  licença. Liberar a partida real quando houver um conjunto mínimo (proposta: ≥ 40 ícones `ready`,
  com pelo menos 20 de nível 1).
- Publicar arquivos com nome com hash no build (o id não deve aparecer na URL).

## 3 — Milhares de identidades curadas

- Mover o catálogo para JSON por categoria + script de validação/merge.
- Curadoria com critério de fama verificável (ex.: ranking de páginas, presença em mídia brasileira e
  global) — sem volume artificial.
- Ferramenta de revisão de nomes/apelidos/homônimos (relatório de chaves a 1 edição entre identidades).
- Pacotes temáticos (anime, futebol, Disney…).

## 4 — Sons e música dinâmicos

- SFX procedurais em Web Audio/Tone.js; música em camadas que cresce com o combo e acelera no fim do
  tempo. Botão de mudo e volume; áudio só após interação.
- Avaliar ElevenLabs (locução/SFX) e Lyria (trilhas) conforme licença — ver `ART_PIPELINE.md`.

## 5 — Gamificação avançada

- Conquistas, missões diárias, sequência de dias, coleção de ícones acertados, molduras/badges
  originais (Rive/Blender), modo temático e desafio diário com seed compartilhada.

## 6 — Dificuldade calibrada por simulação

- Simulador headless usando o próprio motor (`createEngine` + RNG injetável) com perfis de jogador
  (taxa de acerto por nível, velocidade) para calibrar tempos, pesos de nível e exigências de vida.
- Telemetria anônima opcional (taxa de acerto por ícone) para reclassificar níveis 1–3.
- Mudanças nos números canônicos só com proposta + resultado das simulações em `GAME_RULES.md`.

## 7 — Ranking online anti-fraude

- Backend com autenticação; partida assinada pelo servidor (seed + sequência de ids servida pelo
  servidor, respostas validadas no servidor, limites de tempo plausíveis).
- Imagens servidas sem revelar o id; rate limiting; detecção de anomalias.
- Até lá: **sem rankings online** — só recorde local.
