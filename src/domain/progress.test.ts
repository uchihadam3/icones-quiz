import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../config/gameConfig';
import { heatLevel, isFastAnswer, multiplierProgress, RANKS, rankFor } from './progress';
import { multiplierFor } from './scoring';

const s = GAME_CONFIG.scoring;

describe('progresso de gamificação', () => {
  it('multiplicador atual coincide com a regra de pontuação', () => {
    for (let combo = 1; combo <= 40; combo++) {
      expect(multiplierProgress(combo, s).current).toBe(multiplierFor(combo, s));
    }
    expect(multiplierProgress(0, s).current).toBe(1);
  });

  it('mostra quantos acertos faltam para o próximo multiplicador', () => {
    expect(multiplierProgress(0, s)).toMatchObject({ next: 2, remaining: 3 });
    expect(multiplierProgress(2, s)).toMatchObject({ current: 1, next: 2, remaining: 1 });
    expect(multiplierProgress(3, s)).toMatchObject({ current: 2, next: 3, remaining: 3, fraction: 0 });
    expect(multiplierProgress(12, s)).toMatchObject({ current: 4, next: 5, remaining: 3 });
  });

  it('no x5 não há próximo e o anel fica cheio', () => {
    expect(multiplierProgress(15, s)).toEqual({ current: 5, next: null, remaining: 0, fraction: 1 });
    expect(multiplierProgress(99, s).next).toBeNull();
  });

  it('fração do anel fica sempre em [0, 1]', () => {
    for (let combo = 0; combo < 30; combo++) {
      const f = multiplierProgress(combo, s).fraction;
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });

  it('calor acompanha o multiplicador e é limitado a 0–4', () => {
    expect([1, 2, 3, 4, 5, 9].map(heatLevel)).toEqual([0, 1, 2, 3, 4, 4]);
    expect(heatLevel(0)).toBe(0);
  });

  it('resposta rápida exige ≥ 80% do bônus de velocidade', () => {
    const base = { base: 100, levelBonus: 0, multiplier: 1, total: 0 };
    expect(isFastAnswer({ ...base, speedBonus: 40 }, s)).toBe(true);
    expect(isFastAnswer({ ...base, speedBonus: 39 }, s)).toBe(false);
    expect(isFastAnswer({ ...base, speedBonus: 0 }, s)).toBe(false);
  });

  it('títulos crescem com os acertos e informam quanto falta', () => {
    expect(rankFor(0)).toMatchObject({ rank: { id: 'aquecendo' }, remaining: 5 });
    expect(rankFor(5).rank.id).toBe('fa');
    expect(rankFor(24)).toMatchObject({ rank: { id: 'expert' }, remaining: 1 });
    expect(rankFor(500)).toMatchObject({ rank: { id: 'lenda' }, next: null, remaining: 0 });
    const mins = RANKS.map((r) => r.minCorrect);
    expect([...mins].sort((a, b) => a - b)).toEqual(mins);
  });
});
