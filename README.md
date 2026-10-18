# Ícones — Maratona (nome provisório)

Jogo web mobile-first de **adivinhar pela imagem**: aparece a imagem inteira de um personagem ou
pessoa muito famosa (animes, desenhos, Disney/Pixar, games, filmes, séries, música, esporte) e você
digita quem é. Quanto mais acertos seguidos, maior o combo — e mais rápido a vida volta.

**Site:** https://uchihadam3.github.io/icones-quiz/

> **Estado atual (Etapa 01):** mecânicas completas e testadas, mas **ainda sem imagens licenciadas**.
> A partida valendo recorde mostra "Banco de imagens em preparação"; o botão **Testar mecânicas
> (preview)** permite jogar com espaços neutros "Imagem a adicionar". Ver
> [docs/IMAGE_INTEGRATION.md](docs/IMAGE_INTEGRATION.md).

## Como joga

- 3 vidas (nunca mais que 3). Erro ou tempo esgotado custa 1.
- 40 s nas 5 primeiras rodadas, 30 s depois.
- Acertos seguidos sem ajuda recuperam vida: 3, 5, 7, 10, 15 e depois 15 fixo.
- Combo com multiplicador até x5; pontos por acerto, nível do ícone e velocidade.
- 3 pulos e 3 ajudas de "3 alternativas" por partida.

Regras completas e decisões anti-exploit: [docs/GAME_RULES.md](docs/GAME_RULES.md).

## Desenvolvimento

Requer Node 22+.

```bash
npm ci
npm run dev          # http://localhost:5173/icones-quiz/
npm run lint
npm run typecheck
npm test             # unitários + validação de assets
npm run build
npm run test:e2e     # Playwright (360px e desktop) contra o build
```

Para o E2E num ambiente com Chromium pré-instalado: `PLAYWRIGHT_CHROMIUM_PATH=/caminho/chrome npm run test:e2e`;
caso contrário, `npx playwright install chromium` antes.

## Estrutura

```
src/
  config/gameConfig.ts   números canônicos (vidas, tempo, pontuação, dificuldade)
  domain/                regras puras e testadas: engine, lives, scoring, answers, selection, timer, hints, rng
  data/                  catálogo curado, manifesto de imagens e validação
  lib/                   persistência local e animações (GSAP)
  ui/                    componentes React e hooks
public/characters/       imagens <id>.webp (vazio até haver licenças)
docs/                    regras, pipeline de arte, integração de imagens, roadmap
e2e/                     testes Playwright
```

## Deploy

GitHub Actions (`.github/workflows/ci.yml`): em push na `main`, roda lint, typecheck, testes, build e
E2E e publica `dist/` no GitHub Pages com base path `/icones-quiz/`.

## Licença

Código sob [MIT](LICENSE). Nomes, personagens e marcas citados pertencem aos respectivos donos; imagens
(quando existirem) têm licença própria registrada em `src/data/assets-manifest.json`.
