/**
 * Persistência local (somente neste navegador). Não existe ranking online nesta etapa:
 * recordes globais só virão com backend + autenticação + anti-fraude (docs/ROADMAP.md).
 */
const PREFIX = 'icones-quiz:v1:';
const HISTORY_LIMIT = 20;

export interface RunRecord {
  score: number;
  rounds: number;
  correct: number;
  bestCombo: number;
  /** ISO 8601 */
  endedAt: string;
}

export interface Records {
  best: number;
  history: RunRecord[];
  /** Melhor pontuação no modo treino/preview (nunca vale como recorde oficial). */
  practiceBest: number;
}

export type MotionPreference = 'system' | 'reduced' | 'full';

export interface Settings {
  motion: MotionPreference;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as T) } : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // modo privado / armazenamento cheio: o jogo continua sem persistir
  }
}

export function loadRecords(): Records {
  const r = read<Records>('records', { best: 0, history: [], practiceBest: 0 });
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  return {
    best: num(r.best),
    history: Array.isArray(r.history) ? r.history.slice(0, HISTORY_LIMIT) : [],
    practiceBest: num(r.practiceBest),
  };
}

/** Melhor combo já feito em partidas reais. */
export function bestComboEver(records: Records): number {
  return records.history.reduce((max, r) => Math.max(max, r.bestCombo), 0);
}

/** Salva a run e devolve os recordes atualizados (puro em relação ao estado anterior). */
export function addRun(previous: Records, run: RunRecord): Records {
  return { ...previous, best: Math.max(previous.best, run.score), history: [run, ...previous.history].slice(0, HISTORY_LIMIT) };
}

export function addPracticeRun(previous: Records, score: number): Records {
  return { ...previous, practiceBest: Math.max(previous.practiceBest, score) };
}

export function saveRecords(records: Records): void {
  write('records', records);
}

export function loadSettings(): Settings {
  return read<Settings>('settings', { motion: 'system' });
}

export function saveSettings(settings: Settings): void {
  write('settings', settings);
}
