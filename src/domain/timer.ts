import type { GameConfig } from '../config/gameConfig';

/**
 * Timer baseado em relógio (não em ticks): o tempo restante é sempre calculado a partir de `now`,
 * então atrasos de renderização, abas em segundo plano ou ticks duplicados não alteram o resultado.
 */
export interface RoundTimer {
  durationMs: number;
  startedAt: number;
  pausedAt: number | null;
  pausedTotalMs: number;
}

export function roundDurationMs(roundNumber: number, config: GameConfig['timer']): number {
  const seconds = roundNumber <= config.earlyRounds ? config.earlySeconds : config.normalSeconds;
  return seconds * 1000;
}

export function startTimer(durationMs: number, now: number): RoundTimer {
  return { durationMs, startedAt: now, pausedAt: null, pausedTotalMs: 0 };
}

export function elapsedMs(timer: RoundTimer, now: number): number {
  const effectiveNow = timer.pausedAt ?? now;
  return Math.max(0, effectiveNow - timer.startedAt - timer.pausedTotalMs);
}

export function remainingMs(timer: RoundTimer, now: number): number {
  return Math.max(0, timer.durationMs - elapsedMs(timer, now));
}

export function isExpired(timer: RoundTimer, now: number): boolean {
  return remainingMs(timer, now) <= 0;
}

export function pauseTimer(timer: RoundTimer, now: number): RoundTimer {
  if (timer.pausedAt !== null) return timer;
  return { ...timer, pausedAt: now };
}

export function resumeTimer(timer: RoundTimer, now: number): RoundTimer {
  if (timer.pausedAt === null) return timer;
  return { ...timer, pausedAt: null, pausedTotalMs: timer.pausedTotalMs + Math.max(0, now - timer.pausedAt) };
}
