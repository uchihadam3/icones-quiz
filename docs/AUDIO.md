# Áudio: trilha dinâmica e efeitos

## Origem e licenças (resumo honesto)

| O quê | Como foi feito | Licença |
|---|---|---|
| **Trilha** (tema + 5 arranjos) | Gerada com **ACE-Step 1.5** (modelo aberto, licença MIT) rodando **localmente em CPU** via **acestep.cpp** (MIT). Tema de 128 s a 120 BPM em Lá menor; os arranjos são variações *cover-nofsq* do mesmo trecho de 32 compassos, por isso compartilham tempo, tonalidade e estrutura. Edição, loop e masterização: `tools/audio/music_master.py`. | Modelo MIT; faixa original gerada para este projeto. Sem custo. |
| **Efeitos** (28 eventos, 31 arquivos: 3 variações de acerto, 2 de toque e 2 vinhetas da trilha) | Design em camadas (`tools/audio/sfx_design.py`): transientes gravados do **Kenney** (Interface/UI/Impact/Digital/Casino/Sci-fi/Jingles) + corpo tonal afinado em Lá menor (sinos FM, pads, sub) + cauda por convolução. | Kenney = **CC0 1.0**; código MIT. Sem custo. |

O que **não** foi usado, e por quê:
- **Higgsfield** (conectado à conta): a própria ferramenta declara que não gera música nem efeitos de uso
  geral; o modelo de música dela é restrito ao "game pipeline". Não foi contornado.
- **Space público do ACE-Step no Hugging Face**: a cota gratuita de GPU para acesso anônimo esgotou na
  1ª tentativa; o token OAuth da conta não é utilizável fora da ferramenta. Por isso a geração foi local.
- **ElevenLabs / Lyria / HF Jobs pagos**: não havia chave/créditos configurados; nada foi cobrado.

Créditos completos ficam em `src/audio/audio-manifest.json` (`credits`).

## Estrutura musical

- **Camadas** (`public/audio/music/*.opus|mp3`): `menu`, `groove`, `build`, `hype`, `epic` — mesma
  peça, arranjos de intensidade crescente. Cada arquivo = `[cauda 2 s][loop 64 s][cabeça 2 s]`.
- **Ordem das camadas escolhida por medição**, não pelo nome do prompt: x1 é o tema original; as
  variações foram ordenadas por largura estéreo (0,41 → 0,43 → 0,50 → 0,54), brilho (centroide
  347 → 396 → 689 → 593 Hz) e densidade de ataques. O `menu` é a versão lounge (menos agudos, mais pads).
  Todas alinhadas à fonte com deslocamento medido de 0 ms (correlação de ataques 0,79–0,82).
- **Loop**: 32 compassos (64 s), fechado com crossfade equal-power de 1 compasso; a cauda/cabeça de 2 s
  torna o ponto de loop imune ao atraso de início dos decodificadores (MP3/AAC/Opus).
- **Volume**: todas as camadas a −18 LUFS e true-peak ≤ −1,5 dBTP — a progressão é de **arranjo**, não
  de volume.
- **Vinhetas** derivadas do próprio tema (mesmo timbre e tonalidade): recorde (trecho mais intenso do
  arranjo épico + cauda + brilho) e fim de jogo (arranjo de menu com "fita parando" + sinos).

## Como a música reage

O **diretor musical** (`src/audio/director.ts`, puro e testado) traduz o estado do jogo:

| Situação | Arranjo |
|---|---|
| Tela inicial | `menu` |
| Partida, x1 | `groove` |
| x2 | `build` |
| x3–x4 | `hype` |
| x5 | `epic` |
| ≥ 2 acertos relâmpago seguidos | +1 degrau (até `epic`) |
| Tempo acabando | ticks **no tempo da música** (batida a batida) |
| Última vida | batimento cardíaco a cada compasso |
| Pausa / fim | mesmo arranjo, abafado (filtro passa-baixa + −5 dB), sem reiniciar |

- **Histerese**: a intensidade só sobe quando o multiplicador sobe e só desce quando o combo quebra —
  nunca oscila a cada acerto.
- **Transições**: crossfade equal-power de 1 compasso, começando no **próximo compasso** do relógio
  musical; a nova camada entra na **mesma posição** da música (nada reinicia a cada rodada).
- **Deixas**: subir de x2→x5 toca efeitos em camadas crescentes (afinados no tom); quebrar combo toca
  um "scratch"; recuperar vida toca subida + brilho; recorde toca a vinheta épica.

## Motor (`src/audio/engine.ts`)

- AudioContext criado/retomado **só após gesto** do usuário (autoplay). Falhou? O jogo segue mudo e a
  tela de som oferece "Tentar de novo".
- Grafo: camadas → ducking → filtro → volume da música ┐ efeitos → volume ┘→ master → limitador.
- Ducking sutil em eventos importantes (acerto, erro, vida, recorde).
- Deduplicação por chave (id da rodada): StrictMode, re-render ou clique duplo nunca tocam o mesmo som
  duas vezes. Variantes de acerto nunca se repetem em sequência.
- Memória: no máximo 3 camadas decodificadas (atual + anterior + próxima provável).
- Aba escondida: suspende o contexto; ao voltar, retoma com fade.
- Formatos: Opus (Ogg) no Chrome/Firefox/Android; MP3 no Safari sem Opus.
- PWA: áudio entra no cache aos poucos (o que já tocou funciona offline); a instalação não baixa música.

## Preferências

Música e Efeitos com volumes separados + mudo, salvos neste aparelho (`icones-quiz:v1:audio`). Na home,
na pausa e no botão de alto-falante do HUD.

## Regerar

```bash
# Efeitos (precisa dos pacotes Kenney em tools/audio/.cache/kenney)
python tools/audio/sfx_design.py tools/audio/.cache/sfx-wav
# Trilha (precisa das variações renderizadas pelo acestep.cpp)
python tools/audio/music_master.py <dir-com-menu/groove/build/hype/epic.wav>
# Codificação + manifesto
python tools/audio/build_audio.py
```

## Limites da auditoria

Este ambiente **não reproduz som** para um ouvinte; a avaliação foi **objetiva**: espectrogramas,
loudness EBU R128, true-peak, tempo medido (119,99 BPM), correlação de ataques entre camadas (alinhamento),
continuidade da emenda do loop, ausência de cliques nos efeitos (bordas com micro-fade) e decodificação
real no Chromium. A avaliação estética (gosto, "soar profissional") precisa de escuta humana — ver
pendências no relatório da etapa.
