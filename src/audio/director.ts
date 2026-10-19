/**
 * Diretor musical: decide QUAL arranjo deve tocar a partir do estado do jogo. Puro e determinístico.
 *
 * Camadas (todas variações do mesmo tema, mesmo BPM/tonalidade e alinhadas no tempo):
 *   menu   → preparação, convidativa
 *   groove → partida começando / sem combo
 *   build  → sequência crescendo (x2)
 *   hype   → combo alto (x3–x4)
 *   epic   → sequência excepcional (x5) ou combo alto com respostas relâmpago
 * Sobreposição de perigo (ticks no tempo da música + batimento) quando falta tempo ou resta 1 vida.
 *
 * Histerese: a intensidade só SOBE quando o multiplicador sobe (recompensa imediata) e só DESCE quando o
 * combo quebra — nunca oscila a cada acerto. Respostas relâmpago seguidas dão um degrau extra, que só
 * cai quando a sequência relâmpago quebra.
 */
export type MusicLayer = 'menu' | 'groove' | 'build' | 'hype' | 'epic';
export const GAME_LAYERS: readonly MusicLayer[] = ['groove', 'build', 'hype', 'epic'];

export type Scene = 'menu' | 'game' | 'paused' | 'gameover';

export interface MusicSignals {
  scene: Scene;
  multiplier: number;
  lives: number;
  /** Timer no trecho de alerta (últimos segundos) de uma rodada em andamento. */
  timeWarning: boolean;
  /** Respostas relâmpago consecutivas (zera em resposta lenta, erro, pulo ou ajuda). */
  fastStreak: number;
}

export interface MusicTarget {
  layer: MusicLayer;
  /** 0 = sem tensão, 1 = última vida, 2 = tempo acabando (prioritário). */
  danger: 0 | 1 | 2;
  /** Pausa/fim: música abafada e mais baixa, sem parar o relógio musical. */
  muffled: boolean;
}

const TIER_LAYER: Record<number, MusicLayer> = { 1: 'groove', 2: 'build', 3: 'hype', 4: 'hype', 5: 'epic' };

export function layerForMultiplier(multiplier: number): MusicLayer {
  return TIER_LAYER[Math.max(1, Math.min(5, Math.round(multiplier)))] ?? 'groove';
}

/** Promove um degrau quando há ≥ 2 respostas relâmpago seguidas e já existe combo. */
export function withFastBonus(layer: MusicLayer, fastStreak: number): MusicLayer {
  if (fastStreak < 2 || layer === 'groove' || layer === 'menu') return layer;
  const i = GAME_LAYERS.indexOf(layer);
  return GAME_LAYERS[Math.min(GAME_LAYERS.length - 1, i + 1)] ?? layer;
}

export function musicTarget(s: MusicSignals): MusicTarget {
  if (s.scene === 'menu') return { layer: 'menu', danger: 0, muffled: false };
  const layer = withFastBonus(layerForMultiplier(s.multiplier), s.fastStreak);
  if (s.scene === 'paused' || s.scene === 'gameover') return { layer, danger: 0, muffled: true };
  const danger: 0 | 1 | 2 = s.timeWarning ? 2 : s.lives === 1 ? 1 : 0;
  return { layer, danger, muffled: false };
}

/** Eventos musicais (vinhetas/efeitos) derivados de uma mudança de alvo. */
export type MusicCue = 'tier-up' | 'combo-break' | 'enter-danger' | 'leave-danger';

export function cuesBetween(prev: MusicTarget, next: MusicTarget): MusicCue[] {
  const cues: MusicCue[] = [];
  const rank = (l: MusicLayer) => GAME_LAYERS.indexOf(l);
  if (prev.layer !== 'menu' && next.layer !== 'menu') {
    if (rank(next.layer) > rank(prev.layer)) cues.push('tier-up');
    if (rank(next.layer) < rank(prev.layer)) cues.push('combo-break');
  }
  if (prev.danger === 0 && next.danger > 0) cues.push('enter-danger');
  if (prev.danger > 0 && next.danger === 0) cues.push('leave-danger');
  return cues;
}

/** Próximo instante quantizado à grade musical (batida ou compasso), a partir do relógio da música. */
export function nextGridTime(now: number, songStart: number, gridSeconds: number, minLead = 0.05): number {
  const elapsed = Math.max(0, now + minLead - songStart);
  return songStart + Math.ceil(elapsed / gridSeconds) * gridSeconds;
}

/** Curvas de crossfade equal-power (soma de potências constante: sem "buraco" no meio). */
export function equalPowerCurves(steps = 32): { fadeIn: Float32Array; fadeOut: Float32Array } {
  const fadeIn = new Float32Array(steps);
  const fadeOut = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const x = i / (steps - 1);
    fadeIn[i] = Math.sin((x * Math.PI) / 2);
    fadeOut[i] = Math.cos((x * Math.PI) / 2);
  }
  return { fadeIn, fadeOut };
}
