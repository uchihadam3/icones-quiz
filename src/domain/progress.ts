import type { GameConfig } from '../config/gameConfig';
import type { ScoreBreakdown } from './scoring';

/**
 * Leituras de progresso para a camada de gamificação (puras e testáveis).
 * Não mudam regras: só traduzem o estado do jogo em metas visíveis.
 */

export interface MultiplierProgress {
  current: number;
  /** Próximo multiplicador, ou null se já está no máximo. */
  next: number | null;
  /** Acertos seguidos que faltam para o próximo multiplicador. */
  remaining: number;
  /** Progresso 0–1 dentro da faixa atual (para anéis/barras). */
  fraction: number;
}

export function multiplierProgress(combo: number, scoring: GameConfig['scoring']): MultiplierProgress {
  const tiers = scoring.multiplierTiers.slice(0, scoring.maxMultiplier);
  let index = 0;
  tiers.forEach((min, i) => {
    if (combo >= min) index = i;
  });
  const current = combo > 0 ? index + 1 : 1;
  const nextMin = tiers[index + 1];
  if (nextMin === undefined) return { current, next: null, remaining: 0, fraction: 1 };
  const floor = tiers[index] ?? 0;
  const span = Math.max(1, nextMin - floor);
  return { current, next: index + 2, remaining: nextMin - combo, fraction: Math.min(1, (combo - floor) / span) };
}

/** Nível de "calor" visual 0–4, derivado do multiplicador (x1 = frio, x5 = em chamas). */
export function heatLevel(multiplier: number): 0 | 1 | 2 | 3 | 4 {
  return Math.max(0, Math.min(4, multiplier - 1)) as 0 | 1 | 2 | 3 | 4;
}

/** Acerto rápido: ganhou pelo menos 80% do bônus de velocidade. */
export function isFastAnswer(score: ScoreBreakdown, scoring: GameConfig['scoring']): boolean {
  return score.speedBonus > 0 && score.speedBonus >= scoring.maxSpeedBonus * 0.8;
}

export interface Rank {
  id: string;
  title: string;
  /** Acertos (com ou sem ajuda) para alcançar. */
  minCorrect: number;
}

export const RANKS: readonly Rank[] = [
  { id: 'aquecendo', title: 'Aquecendo', minCorrect: 0 },
  { id: 'fa', title: 'Fã de carteirinha', minCorrect: 5 },
  { id: 'expert', title: 'Expert em ícones', minCorrect: 12 },
  { id: 'mestre', title: 'Mestre da cultura pop', minCorrect: 25 },
  { id: 'lenda', title: 'Lenda da Maratona', minCorrect: 40 },
];

export interface RankProgress {
  rank: Rank;
  index: number;
  next: Rank | null;
  /** Acertos que faltam para o próximo título. */
  remaining: number;
}

export function rankFor(correct: number): RankProgress {
  let index = 0;
  RANKS.forEach((r, i) => {
    if (correct >= r.minCorrect) index = i;
  });
  const rank = RANKS[index] as Rank;
  const next = RANKS[index + 1] ?? null;
  return { rank, index, next, remaining: next ? next.minCorrect - correct : 0 };
}
