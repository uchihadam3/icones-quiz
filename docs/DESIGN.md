# Sistema visual

Direção: **arcade moderno premium** — painéis de vidro escuro com relevo, dourado/laranja como energia
principal, ciano para ações secundárias, verde/vermelho só para acerto/erro. Mobile-first (360px+).

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `src/styles/tokens.css` | cores, raios, sombras, fontes e o "calor" do combo (`data-heat` 0–4) |
| `src/styles/base.css` | fundo vivo (aurora, grade em perspectiva, estrelas, vinheta), painéis, textos flutuantes, movimento reduzido |
| `src/styles/buttons.css` | botões 3D com "lábio" (pressionar afunda), brilho, foco, desabilitado, carregando |
| `src/styles/home.css` | logo, CTA, estado bloqueado, recorde, como funciona, instalar |
| `src/styles/game.css` | HUD, cartão com moldura girando, pôster placeholder, timer + pavio, feedback, controles |
| `src/styles/screens.css` | pausa, fim de jogo, celebração de recorde |
| `src/lib/motion.ts` | coreografias GSAP (entrada de tela/cartão, carimbo, contagem, texto flutuante, vibração) |
| `src/lib/particles.ts` | partículas em um único canvas (faíscas, anel, confete); loop só roda com partículas vivas |
| `src/domain/progress.ts` | leituras de gamificação puras: progresso do multiplicador, calor, resposta rápida, títulos |

## Tipografia

- **Lilita One** (títulos, números, botões grandes) e **Nunito** variável (interface) — ambas OFL-1.1,
  auto-hospedadas via `@fontsource` (sem CDN, funcionam offline no PWA).

## Clima reativo

- `html[data-heat]` (0–4) acompanha o multiplicador: o fundo, o brilho do HUD e a moldura do cartão
  esquentam de violeta/ciano até laranja/vermelho/dourado; a moldura gira mais rápido.
- `html[data-danger]` liga quando faltam ≤ 8 s: vinheta vermelha pulsando, moldura e timer vermelhos;
  nos últimos 3 s o timer treme e vibra (quando suportado).

## Feedback (game feel)

| Evento | Resposta |
|---|---|
| Acerto | moldura verde, faíscas, carimbo "Acertou!", pontos voam do placar |
| Acerto rápido (≥ 80% do bônus) | "Relâmpago!", faíscas douradas maiores, selo "rápido +N" |
| Erro / tempo | moldura vermelha, cartão treme, coração perdido estala, vibração |
| Subir multiplicador | selo central "Combo xN!", medalhão pulsa e solta faíscas |
| Recuperar vida | selo "+1 vida!", coração reaparece com faíscas verdes |
| Ajuda / pulo | faíscas ciano / cartão desliza |
| Recorde | faixa com troféu e raios, canhões + chuva de confete |

## Acessibilidade e desempenho

- Movimento reduzido (sistema ou preferência salva): sem partículas, sem vibração, animações aplicam o
  estado final na hora; nenhuma informação depende de animação.
- Contraste AA+ para texto; foco visível em todos os controles; rótulos ARIA nos elementos do HUD.
- Partículas limitadas a 260 e um único canvas; o loop para quando não há partículas.
- Layout do jogo com altura fixa da viewport: com teclado aberto o cartão encolhe e a resposta segue
  visível (testado em 360×430).
