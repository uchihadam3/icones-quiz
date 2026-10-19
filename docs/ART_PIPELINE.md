# Pipeline de arte, áudio e movimento

Princípio: **modular, opcional e com fallback leve**. Cada ferramenta entra só quando resolver um
problema real, com licença compatível com um jogo web público, e sem pesar no celular de entrada.
O jogo sempre funciona só com HTML/CSS/React.

## O que está em uso na Etapa 01

| Camada | Ferramenta | Uso | Fallback |
|---|---|---|---|
| UI | React + TypeScript + Vite | telas, estado, build | — |
| Estilo | CSS puro (tokens em `:root`) | tema, layout responsivo, estados | — |
| Coreografia | **GSAP** (`src/lib/motion.ts`) | entrada do cartão, contagem de pontos, pulso do multiplicador, coração perdido/ganho | com movimento reduzido, aplica o estado final instantaneamente |

**PixiJS/shaders: avaliados e não usados agora.** A tela é um cartão de imagem + HUD; DOM/CSS é mais
nítido, acessível e leve que um canvas WebGL. Pixi só entra se surgir um efeito que o CSS não faça bem
(ver abaixo).

## Pipeline futuro (por necessidade)

| Ferramenta | Para quê | Quando entra | Licença / custo | Fallback |
|---|---|---|---|---|
| **PixiJS** | partículas de combo x5, transições de "streak", fundo animado | se efeitos em DOM custarem > 2 ms/frame em celular médio | MIT | CSS/GSAP atual |
| **GSAP** | timelines de UI, count-ups, sequências de fim de jogo | já em uso | licença "no charge" da GSAP (uso gratuito, inclusive comercial) | CSS transitions |
| **Rive** | mascote/ícones animados com estados (acerto, erro, combo) | quando houver direção de arte de mascote | runtime MIT; editor com plano | SVG estático |
| **Blender + Python (NumPy/SciPy/Pillow)** | renders 3D de troféus/medalhas/molduras originais; geração em lote de variações e sprites | Etapa de gamificação avançada | Blender GPL (arquivos gerados são nossos) | PNG/WebP estático |
| **ComfyUI / FLUX** | **somente arte ORIGINAL** de interface: fundos, texturas, molduras, badges. **Nunca** personagens existentes ou pessoas reais | quando precisar de muito material decorativo | verificar licença do checkpoint (FLUX.1 [dev] é não comercial; usar [schnell]/Apache-2.0 ou licença paga) | gradientes CSS |
| **ACE-Step 1.5 + acestep.cpp** | **em uso (Etapa 03)**: trilha original gerada localmente em CPU, variações alinhadas por *cover-nofsq* | MIT (modelo e runtime), sem custo | sem música (jogo segue com efeitos) |
| **Kenney (CC0)** | **em uso (Etapa 03)**: matéria-prima dos efeitos | CC0 | — |
| **ElevenLabs** | locução curta ("Combo x5!", "Última vida!") | se houver chave e licença comercial clara | plano pago; registrar termos de uso comercial | Web Audio sintetizado |
| **Lyria** (Google) | trilhas originais / stems para música dinâmica | alternativa futura à trilha atual | conferir termos vigentes de uso comercial | trilha atual |
| **Web Audio** | **em uso (Etapa 03)**: motor próprio (`src/audio/engine.ts`) que toca as camadas gravadas, crossfades no compasso e efeitos | — (API do navegador) | silêncio (áudio sempre opcional e com botão de mudo) |
| **FFmpeg** | conversão/recorte de imagens dos ícones (4:5 WebP), compressão de áudio (Opus/AAC) | Etapa 02 (imagens) | LGPL/GPL (ferramenta de build, não distribuída) | Pillow |
| **Atlases** (TexturePacker / free-tex-packer) | empacotar sprites de UI/partículas se o Pixi entrar | junto com Pixi | variam | sprites individuais |

## Orçamentos de desempenho (celular médio)

- JS inicial ≤ 130 KB gzip (hoje ~111 KB, a maior parte React + GSAP).
- Imagem por rodada ≤ ~150 KB WebP; a próxima rodada é pré-carregada.
- Áudio só após interação do usuário, carregado sob demanda, com controle próprio de mudo/volume
  (independente da preferência de movimento).
- Nada de WebGL na primeira pintura.

## Estrutura sugerida de assets

```
art/characters/<id>.webp   # retratos licenciados; publicados como img/<hash>.webp (ver IMAGE_INTEGRATION.md)
public/
  ui/                      # arte original de interface (badges, molduras)
  audio/                   # música e efeitos (Opus + fallback MP3), ver AUDIO.md
tools/                     # scripts Python/FFmpeg (não vão para o bundle)
```

Cada asset de terceiros precisa de registro de licença (como `assets-manifest.json`).
