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
    /** Acertos consecutivos exigidos por vida recuperada. A configuração atual mantém sempre 3. */
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
    /** Cargas iniciais da ajuda "3 alternativas" (também o máximo: nunca acumula acima disso). */
    optionHints: number;
    /** Acertos ACUMULADOS (com ou sem ajuda) que devolvem 1 pulo e 1 carga, respeitando cada teto. */
    aidRechargeEvery: number;
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
    /** Fração dos pontos que o mesmo acerto renderia digitado, quando feito com alternativas (0,5 = metade). */
    optionHintShare: number;
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
  recovery: { thresholds: [3], cap: 3 },
  timer: { earlyRounds: 5, earlySeconds: 25, normalSeconds: 20, warningSeconds: 6 },
  aids: { skips: 3, optionHints: 3, aidRechargeEvery: 5, optionCount: 3 },
  scoring: {
    basePoints: 100,
    levelBonus: { 1: 0, 2: 30, 3: 60 },
    maxSpeedBonus: 50,
    multiplierTiers: [0, 3, 6, 10, 15],
    maxMultiplier: 5,
    optionHintShare: 0.5,
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
