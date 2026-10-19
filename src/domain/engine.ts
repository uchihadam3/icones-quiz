import type { GameConfig } from '../config/gameConfig';
import { buildAnswerIndex, type AnswerIndex } from './answers';
import { buildOptions } from './hints';
import {
  initialLives,
  isRecoveryPaused,
  onMiss,
  onStreakBreak,
  onUnaidedCorrect,
  recoveryRequirement,
  type LivesState,
} from './lives';
import { isFastAnswer } from './progress';
import { statefulRng } from './rng';
import { multiplierFor, scoreUnaided, scoreWithOptionHint, zeroScore, type ScoreBreakdown } from './scoring';
import { selectNext } from './selection';
import { isExpired, pauseTimer, remainingMs, resumeTimer, roundDurationMs, startTimer, type RoundTimer } from './timer';
import type { Category, Identity, Rng } from './types';

/**
 * Motor do jogo: reducer puro (estado + ação → novo estado), sem DOM, sem relógio global e sem Math.random.
 * Toda ação de rodada carrega `roundId`; ações atrasadas/duplicadas (duplo clique, timeout que chega depois
 * do submit, etc.) são ignoradas e devolvem o MESMO objeto de estado.
 */

export type GameMode = 'competitive' | 'preview';
export type Phase = 'playing' | 'feedback' | 'paused' | 'gameover' | 'unavailable';
export type Outcome = 'correct' | 'correct-hint' | 'wrong' | 'timeout' | 'skipped';

export interface Round {
  id: number;
  /** Número exibido (1-based). Rodadas anuladas não avançam o número. */
  number: number;
  identityId: string;
  timer: RoundTimer;
  /** Ids das alternativas, quando a ajuda foi usada. */
  options: string[] | null;
}

export interface Resolution {
  roundId: number;
  identityId: string;
  outcome: Outcome;
  guess?: string;
  score: ScoreBreakdown;
  lifeLost: boolean;
  lifeGained: boolean;
  comboBefore: number;
  comboAfter: number;
}

export interface RunStats {
  correct: number;
  correctWithHint: number;
  wrong: number;
  timeouts: number;
  skips: number;
  hintsUsed: number;
  annulled: number;
  bestCombo: number;
  livesRecovered: number;
}

export interface GameState {
  mode: GameMode;
  phase: Phase;
  rngState: number;
  score: number;
  /** Combo de pontuação: acertos seguidos sem ajuda. Pulo/ajuda congelam; erro zera. */
  combo: number;
  /** Acertos relâmpago (≥ 80% do bônus de velocidade) consecutivos; qualquer outro desfecho zera. */
  fastStreak: number;
  lives: LivesState;
  skipsLeft: number;
  hintsLeft: number;
  round: Round | null;
  nextRoundId: number;
  lastResolution: Resolution | null;
  /** Ids já mostrados no ciclo atual (evita repetição até esgotar o conjunto elegível). */
  used: string[];
  recentCategories: Category[];
  /** Ids cuja imagem falhou nesta run (saem do conjunto elegível). */
  failed: string[];
  /** Próxima identidade já escolhida (a UI pré-carrega a imagem). */
  upcoming: { id: string; cycleReset: boolean } | null;
  stats: RunStats;
}

export type GameAction =
  | { type: 'submit'; roundId: number; guess: string; now: number }
  | { type: 'timeout'; roundId: number; now: number }
  | { type: 'skip'; roundId: number; now: number }
  | { type: 'useHint'; roundId: number; now: number }
  | { type: 'pickOption'; roundId: number; optionId: string; now: number }
  | { type: 'next'; roundId: number; now: number }
  | { type: 'imageFailed'; roundId: number; now: number }
  | { type: 'imageShown'; roundId: number; now: number }
  | { type: 'hide'; now: number }
  | { type: 'resume'; now: number };

export interface EngineDeps {
  catalog: readonly Identity[];
  /** Em modo competitivo, somente ids com imagem pronta entram em jogo. */
  isImageReady: (id: string) => boolean;
  config: GameConfig;
  /**
   * true (usado no app): o timer de uma rodada com imagem só começa quando a UI confirma `imageShown`.
   * Assim, rede lenta nunca consome o tempo do jogador. Rodadas sem imagem (preview) começam na hora.
   */
  timerStartsOnImage?: boolean;
}

export interface Engine {
  start(mode: GameMode, seed: number, now: number): GameState;
  reduce(state: GameState, action: GameAction): GameState;
  identity(id: string): Identity | undefined;
  eligiblePool(mode: GameMode): Identity[];
  answers: AnswerIndex;
}

function emptyStats(): RunStats {
  return { correct: 0, correctWithHint: 0, wrong: 0, timeouts: 0, skips: 0, hintsUsed: 0, annulled: 0, bestCombo: 0, livesRecovered: 0 };
}

export function createEngine(deps: EngineDeps): Engine {
  const { config } = deps;
  const active = deps.catalog.filter((c) => c.active !== false);
  const byId = new Map(active.map((c) => [c.id, c]));
  const answers = buildAnswerIndex(active);

  const eligiblePool = (mode: GameMode) => (mode === 'competitive' ? active.filter((c) => deps.isImageReady(c.id)) : [...active]);

  function withRng<T>(state: GameState, fn: (rng: Rng) => T): [T, number] {
    const r = statefulRng(state.rngState);
    const value = fn(r.rng);
    return [value, r.state()];
  }

  /**
   * Inicia uma rodada. Usa a identidade pré-selecionada (`upcoming`, já pré-carregada pela UI) quando ainda
   * for válida e já escolhe a seguinte, para a imagem da próxima rodada carregar enquanto esta é jogada.
   */
  function beginRound(state: GameState, number: number, now: number): GameState {
    const failed = new Set(state.failed);
    const pool = eligiblePool(state.mode).filter((c) => !failed.has(c.id));
    const poolIds = new Set(pool.map((c) => c.id));
    const lastId = state.round?.identityId;
    const r = statefulRng(state.rngState);

    let current: { identity: Identity; cycleReset: boolean } | null = null;
    const up = state.upcoming;
    const upIdentity = up ? byId.get(up.id) : undefined;
    if (up && upIdentity && poolIds.has(up.id) && up.id !== lastId && (up.cycleReset || !state.used.includes(up.id))) {
      current = { identity: upIdentity, cycleReset: up.cycleReset };
    }
    current ??= selectNext({
      pool,
      round: number,
      used: new Set(state.used),
      recentCategories: state.recentCategories,
      lastId,
      rng: r.rng,
      config: config.selection,
    });
    if (!current) return { ...state, rngState: r.state(), phase: 'unavailable', round: null, upcoming: null };

    const { identity } = current;
    const used = current.cycleReset ? [identity.id] : [...state.used, identity.id];
    const recentCategories = [...state.recentCategories, identity.category].slice(-8);
    const next = selectNext({
      pool,
      round: number + 1,
      used: new Set(used),
      recentCategories,
      lastId: identity.id,
      rng: r.rng,
      config: config.selection,
    });
    return {
      ...state,
      rngState: r.state(),
      phase: 'playing',
      used,
      recentCategories,
      upcoming: next && next.identity.id !== identity.id ? { id: next.identity.id, cycleReset: next.cycleReset } : null,
      nextRoundId: state.nextRoundId + 1,
      round: {
        id: state.nextRoundId,
        number,
        identityId: identity.id,
        timer: waitsForImage(identity.id)
          ? pauseTimer(startTimer(roundDurationMs(number, config.timer), now), now)
          : startTimer(roundDurationMs(number, config.timer), now),
        options: null,
      },
    };
  }

  function waitsForImage(id: string): boolean {
    return deps.timerStartsOnImage === true && deps.isImageReady(id);
  }

  function resolve(state: GameState, outcome: Outcome, extra: { guess?: string; now: number }): GameState {
    const round = state.round;
    if (!round) return state;
    const identity = byId.get(round.identityId);
    let { combo, lives, score } = state;
    let lifeLost = false;
    let lifeGained = false;
    let points = zeroScore();
    const stats = { ...state.stats };

    switch (outcome) {
      case 'correct': {
        combo += 1;
        points = scoreUnaided(
          { combo, level: identity?.level ?? 1, remainingMs: remainingMs(round.timer, extra.now), durationMs: round.timer.durationMs },
          config.scoring,
        );
        const result = onUnaidedCorrect(lives, config);
        lives = result.state;
        lifeGained = result.lifeGained;
        stats.correct += 1;
        if (lifeGained) stats.livesRecovered += 1;
        break;
      }
      case 'correct-hint':
        // Combo congelado: não sobe, não zera. Recuperação já foi zerada ao usar a ajuda.
        points = scoreWithOptionHint(config.scoring);
        stats.correctWithHint += 1;
        break;
      case 'wrong':
      case 'timeout': {
        combo = 0;
        const result = onMiss(lives);
        lives = result.state;
        lifeLost = true;
        if (outcome === 'wrong') stats.wrong += 1;
        else stats.timeouts += 1;
        break;
      }
      case 'skipped':
        lives = onStreakBreak(lives);
        stats.skips += 1;
        break;
    }
    score += points.total;
    stats.bestCombo = Math.max(stats.bestCombo, combo);
    const fast = outcome === 'correct' && isFastAnswer(points, config.scoring);

    return {
      ...state,
      phase: lives.lives <= 0 ? 'gameover' : 'feedback',
      combo,
      fastStreak: fast ? state.fastStreak + 1 : 0,
      lives,
      score,
      stats,
      skipsLeft: outcome === 'skipped' ? state.skipsLeft - 1 : state.skipsLeft,
      lastResolution: {
        roundId: round.id,
        identityId: round.identityId,
        outcome,
        guess: extra.guess,
        score: points,
        lifeLost,
        lifeGained,
        comboBefore: state.combo,
        comboAfter: combo,
      },
    };
  }

  function isLiveRound(state: GameState, roundId: number): boolean {
    return state.phase === 'playing' && state.round !== null && state.round.id === roundId;
  }

  function reduce(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'submit': {
        if (!isLiveRound(state, action.roundId) || !state.round) return state;
        if (state.round.options) return state; // com alternativas abertas, responde-se escolhendo uma opção
        if (isExpired(state.round.timer, action.now)) return resolve(state, 'timeout', { now: action.now });
        const verdict = answers.check(action.guess, state.round.identityId);
        if (!verdict.correct && verdict.reason === 'empty') return state;
        return resolve(state, verdict.correct ? 'correct' : 'wrong', { guess: action.guess, now: action.now });
      }
      case 'timeout': {
        if (!isLiveRound(state, action.roundId) || !state.round) return state;
        if (!isExpired(state.round.timer, action.now)) return state; // timeout prematuro (relógio adiantado) não vale
        return resolve(state, 'timeout', { now: action.now });
      }
      case 'skip': {
        if (!isLiveRound(state, action.roundId) || !state.round || state.skipsLeft <= 0) return state;
        if (isExpired(state.round.timer, action.now)) return resolve(state, 'timeout', { now: action.now });
        return resolve(state, 'skipped', { now: action.now });
      }
      case 'useHint': {
        if (!isLiveRound(state, action.roundId) || !state.round || state.hintsLeft <= 0 || state.round.options) return state;
        if (isExpired(state.round.timer, action.now)) return resolve(state, 'timeout', { now: action.now });
        const target = byId.get(state.round.identityId);
        if (!target) return state;
        const [options, rngState] = withRng(state, (rng) => buildOptions(target, active, config.aids.optionCount, rng));
        return {
          ...state,
          rngState,
          hintsLeft: state.hintsLeft - 1,
          // Usar ajuda quebra a sequência "consecutiva sem ajuda" da recuperação imediatamente.
          lives: onStreakBreak(state.lives),
          stats: { ...state.stats, hintsUsed: state.stats.hintsUsed + 1 },
          // O timer NÃO pausa durante a ajuda (decisão documentada em docs/GAME_RULES.md).
          round: { ...state.round, options: options.map((o) => o.id) },
        };
      }
      case 'pickOption': {
        if (!isLiveRound(state, action.roundId) || !state.round?.options) return state;
        if (!state.round.options.includes(action.optionId)) return state;
        if (isExpired(state.round.timer, action.now)) return resolve(state, 'timeout', { now: action.now });
        const correct = action.optionId === state.round.identityId;
        return resolve(state, correct ? 'correct-hint' : 'wrong', { guess: byId.get(action.optionId)?.displayName, now: action.now });
      }
      case 'next': {
        if (state.phase !== 'feedback' || !state.round || state.round.id !== action.roundId) return state;
        return beginRound(state, state.round.number + 1, action.now);
      }
      case 'imageFailed': {
        if (!isLiveRound(state, action.roundId) || !state.round) return state;
        // Falha técnica nunca custa vida: troca a identidade sem mexer em vidas, combo ou sequência.
        const failedState = { ...state, failed: [...state.failed, state.round.identityId] };
        return beginRound(failedState, state.round.number, action.now);
      }
      case 'imageShown': {
        if (!isLiveRound(state, action.roundId) || !state.round || state.round.timer.pausedAt === null) return state;
        return { ...state, round: { ...state.round, timer: resumeTimer(state.round.timer, action.now) } };
      }
      case 'hide': {
        if (state.phase !== 'playing' || !state.round) return state;
        return { ...state, phase: 'paused', round: { ...state.round, timer: pauseTimer(state.round.timer, action.now) } };
      }
      case 'resume': {
        if (state.phase !== 'paused' || !state.round) return state;
        // Rodada anulada: o personagem visto antes de sair da aba é trocado (impede pesquisar com o tempo congelado).
        // Não custa vida; zera combo e sequência de recuperação para que sair da aba não seja um "pulo grátis".
        const annulled: GameState = {
          ...state,
          combo: 0,
          lives: onStreakBreak(state.lives),
          stats: { ...state.stats, annulled: state.stats.annulled + 1 },
        };
        return beginRound(annulled, state.round.number, action.now);
      }
    }
  }

  function start(mode: GameMode, seed: number, now: number): GameState {
    const base: GameState = {
      mode,
      phase: 'playing',
      rngState: seed >>> 0,
      score: 0,
      combo: 0,
      fastStreak: 0,
      lives: initialLives(config),
      skipsLeft: config.aids.skips,
      hintsLeft: config.aids.optionHints,
      round: null,
      nextRoundId: 1,
      lastResolution: null,
      used: [],
      recentCategories: [],
      failed: [],
      upcoming: null,
      stats: emptyStats(),
    };
    return beginRound(base, 1, now);
  }

  return { start, reduce, identity: (id) => byId.get(id), eligiblePool, answers };
}

// ── Seletores para a UI ──────────────────────────────────────────────────

export interface RecoveryView {
  required: number;
  progress: number;
  paused: boolean;
}

export function recoveryView(state: GameState, config: GameConfig): RecoveryView {
  return {
    required: recoveryRequirement(state.lives.recovered, config),
    progress: state.lives.streak,
    paused: isRecoveryPaused(state.lives, config),
  };
}

export function currentMultiplier(state: GameState, config: GameConfig): number {
  return state.combo > 0 ? multiplierFor(state.combo, config.scoring) : 1;
}

export function roundRemainingMs(state: GameState, now: number): number {
  return state.round ? remainingMs(state.round.timer, now) : 0;
}
