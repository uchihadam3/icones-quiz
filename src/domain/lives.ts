import type { GameConfig } from '../config/gameConfig';

/**
 * Vidas e recuperação.
 *
 * - `streak`: acertos CONSECUTIVOS SEM AJUDA contando para a próxima vida.
 * - `recovered`: quantas vidas já foram recuperadas na run (define a próxima exigência).
 * - Com vidas cheias a recuperação fica pausada: o streak não acumula.
 */
export interface LivesState {
  lives: number;
  streak: number;
  recovered: number;
}

export type LivesConfig = Pick<GameConfig, 'lives' | 'recovery'>;

export function initialLives(config: LivesConfig): LivesState {
  return { lives: Math.min(config.lives.initial, config.lives.max), streak: 0, recovered: 0 };
}

/** Exigência para a (recovered+1)-ésima vida recuperada: [3,5,7,10,15] e depois teto fixo. */
export function recoveryRequirement(recovered: number, config: LivesConfig): number {
  const { thresholds, cap } = config.recovery;
  if (recovered < thresholds.length) return thresholds[recovered] ?? cap;
  return cap;
}

export function isRecoveryPaused(state: LivesState, config: LivesConfig): boolean {
  return state.lives >= config.lives.max;
}

export interface LivesOutcome {
  state: LivesState;
  lifeGained: boolean;
  lifeLost: boolean;
}

/** Acerto por digitação, sem ajuda. */
export function onUnaidedCorrect(state: LivesState, config: LivesConfig): LivesOutcome {
  if (isRecoveryPaused(state, config)) {
    return { state: { ...state, streak: 0 }, lifeGained: false, lifeLost: false };
  }
  const streak = state.streak + 1;
  if (streak >= recoveryRequirement(state.recovered, config)) {
    return {
      state: {
        lives: Math.min(state.lives + 1, config.lives.max),
        streak: 0,
        recovered: state.recovered + 1,
      },
      lifeGained: true,
      lifeLost: false,
    };
  }
  return { state: { ...state, streak }, lifeGained: false, lifeLost: false };
}

/** Erro ou tempo esgotado: exatamente 1 vida e o streak volta a zero. */
export function onMiss(state: LivesState): LivesOutcome {
  return {
    state: { ...state, lives: Math.max(0, state.lives - 1), streak: 0 },
    lifeGained: false,
    lifeLost: true,
  };
}

/** Pulo, uso de ajuda ou rodada anulada: sem custo de vida, mas a sequência deixa de ser "consecutiva sem ajuda". */
export function onStreakBreak(state: LivesState): LivesState {
  return { ...state, streak: 0 };
}
