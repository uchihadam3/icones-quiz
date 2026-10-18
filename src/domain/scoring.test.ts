import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../config/gameConfig';
import { multiplierFor, scoreUnaided, scoreWithOptionHint, timeFraction, zeroScore } from './scoring';

const s = GAME_CONFIG.scoring;

describe('A) combo, multiplicador e pontos', () => {
  it('multiplicador cresce por faixas e para em x5', () => {
    const mults = [1, 2, 3, 4, 5, 6, 9, 10, 14, 15, 30, 999].map((c) => multiplierFor(c, s));
    expect(mults).toEqual([1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5]);
    expect(Math.max(...mults)).toBe(5);
  });

  it('respeita maxMultiplier mesmo com faixas extras configuradas', () => {
    expect(multiplierFor(100, { ...s, multiplierTiers: [0, 1, 2, 3, 4, 5, 6, 7], maxMultiplier: 5 })).toBe(5);
  });

  it('pontos = (base + nível + velocidade) × multiplicador', () => {
    const r = scoreUnaided({ combo: 1, level: 1, remainingMs: 30_000, durationMs: 30_000 }, s);
    expect(r).toEqual({ base: 100, levelBonus: 0, speedBonus: 50, multiplier: 1, total: 150 });
    const hard = scoreUnaided({ combo: 15, level: 3, remainingMs: 15_000, durationMs: 30_000 }, s);
    expect(hard.total).toBe((100 + 60 + 25) * 5);
  });

  it('nível mais difícil vale mais, com mesmas condições', () => {
    const base = { combo: 1, remainingMs: 10_000, durationMs: 30_000 };
    const l1 = scoreUnaided({ ...base, level: 1 }, s).total;
    const l2 = scoreUnaided({ ...base, level: 2 }, s).total;
    const l3 = scoreUnaided({ ...base, level: 3 }, s).total;
    expect(l1).toBeLessThan(l2);
    expect(l2).toBeLessThan(l3);
  });

  it('bônus de velocidade é limitado e fica em [0, max]', () => {
    expect(timeFraction(-5, 1000)).toBe(0);
    expect(timeFraction(5000, 1000)).toBe(1);
    expect(scoreUnaided({ combo: 1, level: 1, remainingMs: 0, durationMs: 30_000 }, s).speedBonus).toBe(0);
  });

  it('acerto com alternativas vale pouco, sem multiplicador nem velocidade', () => {
    const hint = scoreWithOptionHint(s);
    expect(hint.multiplier).toBe(1);
    expect(hint.speedBonus).toBe(0);
    const slowestUnaided = scoreUnaided({ combo: 1, level: 1, remainingMs: 0, durationMs: 30_000 }, s);
    expect(hint.total).toBeLessThan(slowestUnaided.total);
  });

  it('erro vale zero', () => {
    expect(zeroScore().total).toBe(0);
  });
});
