import type { GameConfig, LevelMix } from '../config/gameConfig';
import { pickIndex, pickWeighted } from './rng';
import type { Category, Identity, RecognitionLevel, Rng } from './types';

export type SelectionConfig = GameConfig['selection'];

const LEVELS: readonly RecognitionLevel[] = [1, 2, 3];

/** Pesos de nível para a rodada (1-based). A dificuldade muda PROPORÇÕES, nunca o critério de fama. */
export function levelWeightsFor(round: number, mix: readonly LevelMix[]): Record<RecognitionLevel, number> {
  let current = mix[0]?.weights ?? { 1: 1, 2: 0, 3: 0 };
  for (const band of mix) if (round >= band.fromRound) current = band.weights;
  return current;
}

export interface SelectionInput {
  /** Identidades elegíveis (em partida real: somente com imagem pronta). */
  pool: readonly Identity[];
  round: number;
  /** Ids já usados nesta run (desde o último reinício do ciclo). */
  used: ReadonlySet<string>;
  /** Categorias das rodadas mais recentes (mais recente por último). */
  recentCategories: readonly Category[];
  /** Último id mostrado — nunca repetir imediatamente, mesmo ao reiniciar o ciclo. */
  lastId?: string;
  rng: Rng;
  config: SelectionConfig;
}

export interface SelectionResult {
  identity: Identity;
  /** true quando o conjunto elegível esgotou e o ciclo recomeçou. */
  cycleReset: boolean;
}

export function selectNext(input: SelectionInput): SelectionResult | null {
  const { pool, round, used, recentCategories, lastId, rng, config } = input;
  if (pool.length === 0) return null;

  let cycleReset = false;
  let candidates = pool.filter((c) => !used.has(c.id));
  if (candidates.length === 0) {
    cycleReset = true;
    candidates = pool.filter((c) => c.id !== lastId);
    if (candidates.length === 0) candidates = [...pool];
  }

  const weights = levelWeightsFor(round, config.levelMix);
  const available = LEVELS.filter((lvl) => candidates.some((c) => c.level === lvl));
  const level =
    pickWeighted(available.map((lvl) => [lvl, weights[lvl]] as [RecognitionLevel, number]), rng) ??
    // Nenhum nível com peso disponível (ex.: só sobraram nível 3 nas rodadas iniciais): usa o mais fácil que existir.
    available[0];

  let atLevel = candidates.filter((c) => c.level === level);
  const window = recentCategories.slice(-config.avoidSameCategoryWindow);
  const fresh = atLevel.filter((c) => !window.includes(c.category));
  if (fresh.length > 0) atLevel = fresh;

  const identity = atLevel[pickIndex(atLevel.length, rng)];
  return identity ? { identity, cycleReset } : null;
}
