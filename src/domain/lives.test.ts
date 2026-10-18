import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../config/gameConfig';
import { initialLives, isRecoveryPaused, onMiss, onStreakBreak, onUnaidedCorrect, recoveryRequirement, type LivesState } from './lives';

const cfg = GAME_CONFIG;

function correctTimes(state: LivesState, n: number): { state: LivesState; gained: number } {
  let gained = 0;
  for (let i = 0; i < n; i++) {
    const r = onUnaidedCorrect(state, cfg);
    state = r.state;
    if (r.lifeGained) gained++;
  }
  return { state, gained };
}

describe('B) vidas e recuperação', () => {
  it('começa com 3 vidas e nunca mais que 3', () => {
    expect(initialLives(cfg)).toEqual({ lives: 3, streak: 0, recovered: 0 });
    expect(initialLives({ ...cfg, lives: { initial: 9, max: 3 } }).lives).toBe(3);
  });

  it('exigências [3,5,7,10,15] e depois teto fixo 15', () => {
    const seq = Array.from({ length: 9 }, (_, i) => recoveryRequirement(i, cfg));
    expect(seq).toEqual([3, 5, 7, 10, 15, 15, 15, 15, 15]);
  });

  it('1 erro custa exatamente 1 vida e zera a sequência', () => {
    const r = onMiss({ lives: 2, streak: 2, recovered: 1 });
    expect(r.state).toEqual({ lives: 1, streak: 0, recovered: 1 });
    expect(r.lifeLost).toBe(true);
  });

  it('zero vidas é o piso (nunca negativo)', () => {
    expect(onMiss({ lives: 0, streak: 0, recovered: 0 }).state.lives).toBe(0);
  });

  it('com vidas cheias a recuperação fica pausada e não acumula progresso', () => {
    const full = initialLives(cfg);
    expect(isRecoveryPaused(full, cfg)).toBe(true);
    const { state, gained } = correctTimes(full, 20);
    expect(state).toEqual({ lives: 3, streak: 0, recovered: 0 });
    expect(gained).toBe(0);
  });

  it('após perder vida, recupera com 3 acertos consecutivos (1ª exigência)', () => {
    let s = onMiss(initialLives(cfg)).state;
    s = correctTimes(s, 2).state;
    expect(s.lives).toBe(2);
    const r = onUnaidedCorrect(s, cfg);
    expect(r.lifeGained).toBe(true);
    expect(r.state).toEqual({ lives: 3, streak: 0, recovered: 1 });
  });

  it('a sequência precisa ser realmente consecutiva: erro no meio recomeça do zero', () => {
    let s: LivesState = { lives: 2, streak: 0, recovered: 0 };
    s = correctTimes(s, 2).state;
    s = onMiss(s).state; // 1 vida, streak 0
    s = correctTimes(s, 2).state;
    expect(s).toEqual({ lives: 1, streak: 2, recovered: 0 });
    s = correctTimes(s, 1).state;
    expect(s).toEqual({ lives: 2, streak: 0, recovered: 1 });
  });

  it('pulo/ajuda zeram apenas a sequência de recuperação', () => {
    expect(onStreakBreak({ lives: 2, streak: 4, recovered: 2 })).toEqual({ lives: 2, streak: 0, recovered: 2 });
  });

  it('recuperações seguintes exigem 5, 7, 10, 15, 15…', () => {
    let s: LivesState = { lives: 1, streak: 0, recovered: 0 };
    const needed: number[] = [];
    for (let k = 0; k < 7; k++) {
      // perde uma vida para nunca ficar cheio (exceto quando já estiver em 1, mantém)
      if (s.lives >= 2) s = { ...s, lives: 1 };
      let count = 0;
      for (;;) {
        count++;
        const r = onUnaidedCorrect(s, cfg);
        s = r.state;
        if (r.lifeGained) break;
      }
      needed.push(count);
    }
    expect(needed).toEqual([3, 5, 7, 10, 15, 15, 15]);
  });

  it('vidas nunca passam do máximo, mesmo recuperando', () => {
    const r = onUnaidedCorrect({ lives: 2, streak: 2, recovered: 0 }, cfg);
    expect(r.state.lives).toBe(3);
    expect(onUnaidedCorrect(r.state, cfg).state.lives).toBe(3);
  });
});
