import { beforeEach, describe, expect, it } from 'vitest';
import { addPracticeRun, addRun, bestComboEver, loadRecords, saveRecords } from './storage';

const run = (score: number, bestCombo = 0) => ({ score, rounds: 3, correct: 2, bestCombo, endedAt: '2026-10-18T00:00:00Z' });

describe('recordes locais', () => {
  beforeEach(() => localStorage.clear());

  it('começa vazio e tolera dados antigos/corrompidos', () => {
    expect(loadRecords()).toEqual({ best: 0, history: [], practiceBest: 0 });
    localStorage.setItem('icones-quiz:v1:records', JSON.stringify({ best: 500, history: [run(500)] }));
    expect(loadRecords()).toMatchObject({ best: 500, practiceBest: 0 });
    localStorage.setItem('icones-quiz:v1:records', '{quebrado');
    expect(loadRecords().best).toBe(0);
  });

  it('recorde oficial só sobe; histórico limitado a 20', () => {
    let r = loadRecords();
    for (let i = 0; i < 25; i++) r = addRun(r, run(i * 10, i));
    expect(r.best).toBe(240);
    expect(r.history).toHaveLength(20);
    expect(bestComboEver(r)).toBe(24);
    r = addRun(r, run(5));
    expect(r.best).toBe(240);
  });

  it('treino tem recorde separado e não mexe no oficial', () => {
    const r = addPracticeRun(addRun(loadRecords(), run(100)), 900);
    expect(r).toMatchObject({ best: 100, practiceBest: 900 });
    saveRecords(r);
    expect(loadRecords()).toMatchObject({ best: 100, practiceBest: 900 });
  });
});
