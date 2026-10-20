# Roadmap

## ✅ Etapa 01 — vertical slice

- Motor puro com vidas, recuperação, combo, pulos/ajudas, timer justo e seleção com RNG injetável.
- Validação de respostas com normalização, apelidos, tolerância a erro e proteção contra homônimos.
- Catálogo inicial curado (89 ícones) + manifesto de imagens (todas `missing`).
- Interface mobile-first com GSAP, movimento reduzido e teclado; preview de desenvolvimento.
- CI (lint, typecheck, unitários, validação de assets, build, E2E 360px/desktop) e deploy no Pages.

## ✅ Etapa 02 — polimento visual e gamificação

## ✅ Etapa 03 — trilha dinâmica, efeitos e catálogo grande

- Trilha original em 5 arranjos alinhados (ACE-Step 1.5, local) regida por diretor musical com histerese.
- 28 eventos sonoros em camadas (Kenney CC0 + design próprio), controles de volume/mudo.
- Catálogo de 583 ícones curados, carregado sob demanda; publicação de imagens com nome-hash.

## ✅ Etapa 04 — expansão do catálogo e jogo mais justo

- 1.492 ícones curados (+909), auditoria `npm run catalog:report` e fila de imagens priorizada.
- Digitação justa (letra dobrada, "Snoop Dog", 2 edições em nomes longos) + corretor sem spoiler.
- 25 s/20 s, alternativas recarregáveis (+1 a cada 15 acertos, metade dos pontos), barra "Recuperar vida".
- Pendências: escuta humana da trilha/efeitos (ajustes de mix por ouvido) e as imagens.

## 2 — Pacote de imagens (com o Codex)

- Seguir `docs/IMAGE_INTEGRATION.md`: obter imagens com licença, converter para WebP 4:5, preencher o
  manifesto (`ready` + fonte, autor, licença, atribuição).
- Página de **créditos** listando a atribuição de cada imagem.
- Começar pelas pessoas reais com fotos livres no Wikimedia Commons; personagens protegidos só com
  licença. A partida real libera sozinha ao atingir 30 ícones `ready` com 12 de nível 1
  (`src/data/unlock.json`); as imagens já são publicadas como `img/<hash>.webp`.

## 3 — Milhares de identidades curadas

- Mover o catálogo para JSON por categoria + script de validação/merge.
- Curadoria com critério de fama verificável (ex.: ranking de páginas, presença em mídia brasileira e
  global) — sem volume artificial.
- Ferramenta de revisão de nomes/apelidos/homônimos (relatório de chaves a 1 edição entre identidades).
- Pacotes temáticos (anime, futebol, Disney…).

## 4 — Áudio: próximos passos

- Escuta humana em celulares reais e ajuste de mix por ouvido (o mix atual foi validado por medição).
- Stems separados por instrumento (hoje as camadas são arranjos completos alinhados) para intensidade
  ainda mais granular; locução curta opcional ("Combo x5!") se houver ferramenta com licença clara.

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
