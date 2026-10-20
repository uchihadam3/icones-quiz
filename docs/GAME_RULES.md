# Regras do jogo e decisões de balanceamento

Todos os números ficam em `src/config/gameConfig.ts`. A lógica é pura (sem DOM, sem relógio global,
sem `Math.random`) em `src/domain/` e coberta por testes. **Mudar um número canônico exige proposta
escrita aqui + evidência de testes/simulação.**

## Visão

Jogo de **adivinhar pela imagem**. A imagem aparece **inteira e nítida desde o início** — nunca
borrada nem revelada aos poucos. Não é um Akinator.

## Números canônicos

| Item | Valor | Onde |
|---|---|---|
| Vidas iniciais / máximo | 3 / 3 | `lives` |
| Tempo das rodadas 1–5 | 25 s | `timer.earlySeconds` |
| Tempo a partir da rodada 6 | 20 s fixos (combo e progressão não reduzem) | `timer.normalSeconds` |
| Acertos seguidos por vida recuperada | 3, 5, 7, 10, 15 e depois 15 fixo | `recovery` |
| Pulos por run | 3 | `aids.skips` |
| Cargas de "3 alternativas" (início e teto) | 3 | `aids.optionHints` |
| Acertos acumulados por carga devolvida | 15 | `aids.optionHintRechargeEvery` |
| Pontos de um acerto com alternativas | metade do acerto digitado | `scoring.optionHintShare` |
| Multiplicador máximo | x5 | `scoring.maxMultiplier` |

## Vidas

- Erro **ou** tempo esgotado custa **exatamente 1 vida**. Nunca 2 pelo mesmo evento: toda ação carrega
  o `roundId` e, depois que a rodada é resolvida, ações atrasadas (timeout que chega após o submit,
  duplo Enter, duplo clique) são ignoradas e devolvem o mesmo estado.
- A run termina quando a 3ª vida zera.

## Recuperação de vida

- Conta **acertos consecutivos, digitados, sem ajuda**.
- Exigência da 1ª vida recuperada: 3; 2ª: 5; 3ª: 7; 4ª: 10; 5ª: 15; depois sempre 15.
- Erro/timeout zera a sequência. Recuperar uma vida zera **só** o contador de recuperação; o combo de
  pontuação continua.
- Com 3 vidas, a recuperação fica **pausada**: nada acumula para "vida extra".
- A barra **"Recuperar vida"** fica sempre visível no placar, junto aos corações: progresso `x/y`,
  "faltam N acertos seguidos", animação a cada acerto, "Sequência interrompida — comece de novo" na
  quebra e "+1 VIDA — recuperada por sequência de acertos!" ao recuperar. Com 3 vidas: "Vidas completas".

## Combo e pontuação

- Combo = acertos digitados seguidos, sem ajuda. Multiplicador por faixas de combo
  `[0, 3, 6, 10, 15]` → x1…x5 (nunca passa de x5).
- Pontos por acerto: `(100 + bônus de nível + bônus de velocidade) × multiplicador`.
  - Bônus de nível: nível 1 = 0, nível 2 = 30, nível 3 = 60.
  - Bônus de velocidade: até 50, proporcional ao tempo restante.
- Erro: 0 pontos e combo volta a 0.

## Pulos e ajudas (anti-exploit)

| Ação | Vida | Pontos | Combo | Sequência de recuperação |
|---|---|---|---|---|
| Pular | mantém | 0 | **congelado** | **zera** |
| Usar "3 alternativas" | — | — | — | **zera na hora** |
| Acertar pela alternativa | mantém | **metade** do mesmo acerto digitado (base + nível + velocidade, × multiplicador atual), `Math.round` | **congelado** | continua 0 |
| Errar a alternativa | −1 | 0 | zera | zera |

Por quê: se pular/ajuda não zerasse a sequência, daria para "pular os difíceis" e recuperar vidas só
com os fáceis. Congelar (em vez de zerar) o combo mantém pular útil sem transformar ajuda em pontos.
Um acerto com alternativas vale exatamente metade do mesmo acerto digitado (testado em `scoring.test.ts`).

### Recarga das alternativas (sistema separado das vidas)

- Começa com **3 cargas**; cada uso consome 1 (duplo clique não cobra 2; 1 uso por rodada).
- **+1 carga a cada 15 acertos ACUMULADOS** na partida — não precisam ser seguidos; acertos com
  alternativas contam; erro, tempo e pulo **não zeram** o progresso; pulo não conta.
- Teto de 3: com as cargas cheias o medidor fica parado em 0/15 (sem estoque invisível); ao gastar uma,
  recomeça de 0/15. Nova partida = 3 cargas e medidor zerado.
- Visual próprio (cristais violeta + linha de recarga no botão), diferente da barra de vida.

**O timer NÃO pausa durante a ajuda.** Estourar o tempo com as alternativas abertas custa 1 vida
(testado em `engine.test.ts`).

Com as alternativas abertas, digitar não responde; a resposta é escolher uma opção (mouse/toque ou
teclas 1–3). As alternativas são do mesmo tipo (pessoa × personagem), preferencialmente da mesma
categoria, em ordem embaralhada pelo RNG.

## Digitação justa

- Acentos, caixa, hífens, espaços e pontuação não importam; nomes e apelidos curados valem
  ("Naruto", "Sasuke", "Gojo"…). Pessoas reais: só nomes artísticos/apelidos independentes — nunca
  "Jim", "Jennifer", "Michael" sozinhos.
- Erros tolerados (sem ambiguidade com outra identidade, à mesma distância ou menos):
  5–7 letras → tecla vizinha, inversão ou letra dobrada; 8+ → 1 edição, sem cortar o final (exceto
  letra repetida: "Snoop Dog"); 9+ → até 2 edições, nunca um começo do nome e com ≥ 80% do tamanho.
- **Corretor "Você quis dizer"**: aparece só quando o texto é um erro tolerado de UM nome do catálogo
  inteiro (não usa a resposta da rodada, nunca completa prefixos). Tocar/Tab substitui sem enviar;
  enviar com o erro também vale, e o feedback mostra a grafia certa ("grafia corrigida").

## Timer, aba e falhas de imagem

- Timer baseado em relógio: o tempo restante é calculado a partir de `now`, então atrasos de render
  ou ticks duplicados não mudam o resultado. Timeout "prematuro" é ignorado; resposta após o prazo vira
  timeout.
- **O timer só começa quando a imagem aparece** (`imageShown`): rede lenta não consome tempo.
- **Sair da aba / botão pausar**: o tempo congela e a imagem é coberta. Ao tocar "Continuar", a rodada
  é **anulada**: entra outro ícone, com tempo cheio, **sem perder vida**; combo e sequência de
  recuperação recomeçam do zero. Assim ninguém pesquisa o ícone com o tempo parado, e uma interrupção
  real (ligação) não custa vida.
- Falha ao carregar imagem: troca o ícone sem nenhum custo e remove o id do conjunto daquela run.

## Respostas digitadas

Ver `src/domain/answers.ts` e `answers.test.ts`.

- Normalização Unicode (NFKD): acento, caixa, pontuação e espaços não importam
  (`Homem-Aranha` = `homem aranha` = `homemaranha`; `Pelé` = `pele`).
- Aceita nomes e apelidos cadastrados (pt-BR, original e inglês). **Prefixos arbitrários não valem**
  ("Darth", "Homem").
- Tolerância de 1 erro de teclado:
  - menos de 5 letras: só exato;
  - 5–7 letras: só tecla vizinha (QWERTY) ou inversão de duas letras adjacentes;
  - 8+ letras: 1 edição qualquer (troca, inversão, letra extra/faltando), **exceto cortar o final**.
- **Nunca** aceita o nome de outra identidade do catálogo, nem um erro de digitação que fique a 1 edição
  de outra identidade (ambíguo).
- Nomes ambíguos ficam em `rejected` (ex.: "Ronaldo" para Cristiano Ronaldo e Ronaldo Fenômeno; "MJ"
  para Jackson e Jordan; "Woody" para o Pica-Pau; "Serena" para Sailor Moon e Serena Williams).
- O catálogo é validado para que nenhuma chave aceita pertença a duas identidades.

## Seleção e dificuldade

- Partida valendo recorde **só usa identidades com imagem pronta** (`status: ready` no manifesto).
  Sem nenhuma, a tela inicial mostra "Banco de imagens em preparação".
- A dificuldade muda **proporções de nível**, nunca o critério de fama:

  | Rodadas | Nível 1 | Nível 2 | Nível 3 |
  |---|---|---|---|
  | 1–5 | 80% | 20% | 0% |
  | 6–15 | 50% | 40% | 10% |
  | 16–30 | 30% | 45% | 25% |
  | 31+ | 20% | 40% | 40% |

  Nível 1 continua aparecendo nas rodadas altas.
- Sem repetição na run até esgotar o conjunto elegível; ao recomeçar o ciclo, nunca repete o último.
- Evita a mesma categoria das 2 rodadas anteriores quando houver alternativa.
- RNG injetável (mulberry32, seed por partida): sequência reprodutível nos testes.
- A próxima identidade é escolhida com uma rodada de antecedência para pré-carregar a imagem.

## Persistência e ranking

Recorde e últimas 20 partidas ficam em `localStorage` (somente partidas reais; preview não grava).
**Não existe ranking online** — ele só virá com backend, autenticação e validação anti-fraude.
