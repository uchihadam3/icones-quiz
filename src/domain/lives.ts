import type { GameConfig } from '../config/gameConfig';

/**
 * Vidas e recuperação.
 *
 * - `streak`: acertos CONSECUTIVOS contando para a próxima vida, com ou sem alternativas.
 * - `recovered`: quantas vidas já foram recuperadas na run.
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

/** Exigência para a próxima vida; a configuração canônica mantém sempre 3. */
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

/** Qualquer acerto, digitado ou com alternativas. */
export function onCorrect(state: LivesState, config: LivesConfig): LivesOutcome {
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

/** Pulo ou rodada anulada: sem custo de vida, mas interrompe a sequência de acertos. */
export function onStreakBreak(state: LivesState): LivesState {
  return { ...state, streak: 0 };
}
