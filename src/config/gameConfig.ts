/**
 * Números canônicos do jogo. Tudo que afeta balanceamento mora aqui.
 * Mudar um valor canônico exige proposta + evidência de testes (ver docs/GAME_RULES.md).
 */
import type { RecognitionLevel } from '../domain/types';

export interface LevelMix {
  /** Rodada (1-based) a partir da qual esta faixa vale. */
  fromRound: number;
  /** Pesos relativos por nível de reconhecimento (1 = mais famoso). */
  weights: Record<RecognitionLevel, number>;
}

export interface GameConfig {
  lives: { initial: number; max: number };
  recovery: {
    /** Acertos consecutivos sem ajuda exigidos para a 1ª, 2ª, 3ª… vida recuperada. */
    thresholds: readonly number[];
    /** Exigência fixa depois que a lista acaba. */
    cap: number;
  };
  timer: {
    /** Quantas rodadas iniciais usam o tempo estendido. */
    earlyRounds: number;
    earlySeconds: number;
    normalSeconds: number;
    /** Abaixo disso o timer entra em estado "acabando". */
    warningSeconds: number;
  };
  aids: {
    skips: number;
    optionHints: number;
    /** Quantidade de alternativas exibidas pela ajuda (inclui a correta). */
    optionCount: number;
  };
  scoring: {
    basePoints: number;
    /** Bônus por nível de reconhecimento (mais difícil vale mais). */
    levelBonus: Record<RecognitionLevel, number>;
    /** Bônus máximo de velocidade, proporcional ao tempo restante. */
    maxSpeedBonus: number;
    /** Combo mínimo (após o acerto) para cada multiplicador x1…x5. */
    multiplierTiers: readonly number[];
    maxMultiplier: number;
    /** Pontos fixos de um acerto feito com a ajuda de alternativas (sem multiplicador nem velocidade). */
    optionHintPoints: number;
  };
  selection: {
    levelMix: readonly LevelMix[];
    /** Evita repetir a mesma categoria em rodadas seguidas quando houver alternativa. */
    avoidSameCategoryWindow: number;
  };
  feedback: {
    correctDelayMs: number;
    wrongDelayMs: number;
  };
}

export const GAME_CONFIG: GameConfig = {
  lives: { initial: 3, max: 3 },
  recovery: { thresholds: [3, 5, 7, 10, 15], cap: 15 },
  timer: { earlyRounds: 5, earlySeconds: 40, normalSeconds: 30, warningSeconds: 8 },
  aids: { skips: 3, optionHints: 3, optionCount: 3 },
  scoring: {
    basePoints: 100,
    levelBonus: { 1: 0, 2: 30, 3: 60 },
    maxSpeedBonus: 50,
    multiplierTiers: [0, 3, 6, 10, 15],
    maxMultiplier: 5,
    optionHintPoints: 30,
  },
  selection: {
    levelMix: [
      { fromRound: 1, weights: { 1: 80, 2: 20, 3: 0 } },
      { fromRound: 6, weights: { 1: 50, 2: 40, 3: 10 } },
      { fromRound: 16, weights: { 1: 30, 2: 45, 3: 25 } },
      { fromRound: 31, weights: { 1: 20, 2: 40, 3: 40 } },
    ],
    avoidSameCategoryWindow: 2,
  },
  feedback: { correctDelayMs: 1100, wrongDelayMs: 2200 },
};
