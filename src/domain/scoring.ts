import type { GameConfig } from '../config/gameConfig';
import type { RecognitionLevel } from './types';

export type ScoringConfig = GameConfig['scoring'];

/** Multiplicador para um combo (contando o acerto atual). Nunca passa de maxMultiplier. */
export function multiplierFor(combo: number, config: ScoringConfig): number {
  let tier = 0;
  config.multiplierTiers.forEach((min, i) => {
    if (combo >= min) tier = i;
  });
  return Math.min(tier + 1, config.maxMultiplier);
}

/** Fração de tempo restante em [0, 1]. */
export function timeFraction(remainingMs: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return Math.min(1, Math.max(0, remainingMs / durationMs));
}

export interface UnaidedScoreInput {
  /** Combo DEPOIS de contar este acerto (com alternativas: o combo atual, que fica congelado). */
  combo: number;
  level: RecognitionLevel;
  remainingMs: number;
  durationMs: number;
}

export interface ScoreBreakdown {
  base: number;
  levelBonus: number;
  speedBonus: number;
  multiplier: number;
  total: number;
  /** Presente quando o acerto foi com alternativas: fração aplicada sobre o valor digitado. */
  aidedShare?: number;
}

/** Acerto digitado, sem ajuda: (base + nível + velocidade) × multiplicador. */
export function scoreUnaided(input: UnaidedScoreInput, config: ScoringConfig): ScoreBreakdown {
  const base = config.basePoints;
  const levelBonus = config.levelBonus[input.level];
  const speedBonus = Math.round(config.maxSpeedBonus * timeFraction(input.remainingMs, input.durationMs));
  const multiplier = multiplierFor(input.combo, config);
  return { base, levelBonus, speedBonus, multiplier, total: (base + levelBonus + speedBonus) * multiplier };
}

/**
 * Acerto com a ajuda de alternativas: METADE do que o mesmo acerto valeria digitado naquele instante —
 * mesma base, nível, velocidade e o multiplicador do combo ATUAL (`input.combo` é o combo antes da
 * rodada: com ajuda o combo não sobe). Arredondamento: Math.round (meio ponto arredonda para cima).
 */
export function scoreWithOptionHint(input: UnaidedScoreInput, config: ScoringConfig): ScoreBreakdown {
  const full = scoreUnaided(input, config);
  return { ...full, total: Math.round(full.total * config.optionHintShare), aidedShare: config.optionHintShare };
}

export function zeroScore(): ScoreBreakdown {
  return { base: 0, levelBonus: 0, speedBonus: 0, multiplier: 1, total: 0 };
}
