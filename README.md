# Ícones — Maratona (nome provisório)

Jogo web mobile-first de **adivinhar pela imagem**: aparece a imagem inteira de um personagem ou
pessoa muito famosa (animes, desenhos, Disney/Pixar, games, filmes, séries, música, esporte) e você
digita quem é. Quanto mais acertos seguidos, maior o combo — e mais rápido a vida volta.

**Site:** https://uchihadam3.github.io/icones-quiz/

> **Estado atual:** mecânicas, visual, trilha dinâmica, efeitos e catálogo de **1.492 ícones**
> curados. Há **858 imagens prontas** (as demais aguardam arte); a partida valendo recorde já está liberada. O treino ainda
> mostra pôsteres neutros "Imagem a adicionar" para entradas sem imagem. Ver
> [docs/IMAGE_INTEGRATION.md](docs/IMAGE_INTEGRATION.md) e [docs/AUDIO.md](docs/AUDIO.md).

## Como joga

- 3 vidas (nunca mais que 3). Erro ou tempo esgotado custa 1.
- 25 s nas 5 primeiras rodadas, 20 s fixos depois (o desafio é reconhecer, não correr contra um relógio cada vez menor).
- Acertos seguidos sem ajuda recuperam vida: 3, 5, 7, 10, 15 e depois 15 fixo.
- Combo com multiplicador até x5; pontos por acerto, nível do ícone e velocidade.
- 3 pulos e 3 ajudas de "3 alternativas" por partida.

Regras completas e decisões anti-exploit: [docs/GAME_RULES.md](docs/GAME_RULES.md).
Sistema visual, animações e game feel: [docs/DESIGN.md](docs/DESIGN.md).
Trilha dinâmica e efeitos sonoros: [docs/AUDIO.md](docs/AUDIO.md). Catálogo e curadoria: [docs/CATALOG.md](docs/CATALOG.md).

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
npm run assets:sync  # manifesto de imagens + resumo da home (após mexer no catálogo)
npm run assets:report # total, missing/ready/rejected, por categoria e nível
npm run catalog:report # auditoria do catálogo + fila priorizada de imagens (-- --write grava reports/)
```

Para o E2E num ambiente com Chromium pré-instalado: `PLAYWRIGHT_CHROMIUM_PATH=/caminho/chrome npm run test:e2e`;
caso contrário, `npx playwright install chromium` antes.

## Estrutura

```
src/
  config/gameConfig.ts   números canônicos (vidas, tempo, pontuação, dificuldade)
  domain/                regras puras e testadas: engine, lives, scoring, answers, selection, timer, hints, rng
  data/                  catálogo curado (catalog/*.ts), manifesto de imagens e validação
  audio/                 motor de áudio, diretor musical e manifesto de áudio
  lib/                   persistência local e animações (GSAP)
  ui/                    componentes React e hooks
art/characters/          imagens <id>.webp (fonte; publicadas como img/<hash>.webp)
public/audio/            trilha (5 camadas) e efeitos, em Opus + MP3
tools/audio/             pipeline reprodutível de efeitos, masterização e codificação
docs/                    regras, pipeline de arte, integração de imagens, roadmap
e2e/                     testes Playwright
```

## Deploy

GitHub Actions (`.github/workflows/ci.yml`): em push na `main`, roda lint, typecheck, testes, build e
E2E e publica `dist/` no GitHub Pages com base path `/icones-quiz/`.

## Licença

Código sob [MIT](LICENSE). Nomes, personagens e marcas citados pertencem aos respectivos donos. Fotografias
externas têm licença própria registrada em `src/data/assets-manifest.json`; ilustrações geradas têm
proveniência e nota de direitos registradas separadamente.


## Instalar no celular (PWA)

O projeto inclui manifesto PWA, ícones PNG 192/512, service worker com cache do aplicativo e
orientações na tela inicial. **Não existe um APK separado:** a instalação é feita diretamente
pelo navegador quando o GitHub Pages estiver publicado em HTTPS.

- **Android (Chrome):** visite https://uchihadam3.github.io/icones-quiz/ e toque em
  «Instalar aplicativo» (quando oferecido) ou no menu ⋮ → «Instalar app» / «Adicionar à tela inicial».
- **iPhone (Safari):** abra o site no Safari, toque em Compartilhar e escolha
  «Adicionar à Tela de Início».
- Os arquivos básicos da interface ficam disponíveis offline depois da primeira visita, mas
  imagens futuras dependem de terem sido carregadas; partidas competitivas exigem imagens.

**Atenção, configuração externa indispensável:** em 
https://github.com/uchihadam3/icones-quiz/settings/pages, selecione
*Build and deployment → Source → GitHub Actions*, depois execute novamente a workflow
«CI & Deploy». Sem ativar o Pages, o deploy falha com 404, independentemente dos testes.
