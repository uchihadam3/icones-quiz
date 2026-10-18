import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../config/gameConfig';
import { CHARACTERS } from '../data/characters';
import { createEngine } from './engine';
import { createRng } from './rng';
import { levelWeightsFor, selectNext } from './selection';
import type { Category, Identity, RecognitionLevel } from './types';

const sel = GAME_CONFIG.selection;

function fakePool(perLevel: Record<RecognitionLevel, number>): Identity[] {
  const cats: Category[] = ['anime', 'cartoon', 'game', 'sport'];
  const out: Identity[] = [];
  for (const lvl of [1, 2, 3] as const) {
    for (let i = 0; i < perLevel[lvl]; i++) {
      out.push({
        id: `l${lvl}-${i}`,
        kind: 'character',
        category: cats[i % cats.length] as Category,
        level: lvl,
        displayName: `L${lvl} ${i}`,
        names: [`nome ${lvl} ${i}`],
        origin: 'teste',
      });
    }
  }
  return out;
}

describe('F) seleção do catálogo', () => {
  it('faixas de nível por rodada', () => {
    expect(levelWeightsFor(1, sel.levelMix)).toEqual({ 1: 80, 2: 20, 3: 0 });
    expect(levelWeightsFor(5, sel.levelMix)).toEqual({ 1: 80, 2: 20, 3: 0 });
    expect(levelWeightsFor(6, sel.levelMix)).toEqual({ 1: 50, 2: 40, 3: 10 });
    expect(levelWeightsFor(40, sel.levelMix)).toEqual({ 1: 20, 2: 40, 3: 40 });
  });

  it('rodadas altas continuam trazendo ícones fáceis (nível 1) ocasionalmente', () => {
    expect(levelWeightsFor(1000, sel.levelMix)[1]).toBeGreaterThan(0);
  });

  it('distribuição previsível com RNG injetado (≈ pesos configurados)', () => {
    const pool = fakePool({ 1: 50, 2: 50, 3: 50 });
    const rng = createRng(42);
    const counts = { 1: 0, 2: 0, 3: 0 };
    const N = 6000;
    for (let i = 0; i < N; i++) {
      const r = selectNext({ pool, round: 40, used: new Set(), recentCategories: [], rng, config: sel });
      counts[r!.identity.level]++;
    }
    expect(counts[1] / N).toBeCloseTo(0.2, 1);
    expect(counts[2] / N).toBeCloseTo(0.4, 1);
    expect(counts[3] / N).toBeCloseTo(0.4, 1);
  });

  it('rodadas iniciais nunca trazem nível 3 quando há nível 1–2 disponível', () => {
    const pool = fakePool({ 1: 10, 2: 10, 3: 10 });
    const rng = createRng(7);
    for (let i = 0; i < 2000; i++) {
      const r = selectNext({ pool, round: 1 + (i % 5), used: new Set(), recentCategories: [], rng, config: sel });
      expect(r!.identity.level).not.toBe(3);
    }
  });

  it('mesma seed ⇒ mesma sequência (reprodutível)', () => {
    const pool = fakePool({ 1: 10, 2: 10, 3: 10 });
    const run = (seed: number) => {
      const rng = createRng(seed);
      return Array.from({ length: 20 }, (_, i) => selectNext({ pool, round: i + 1, used: new Set(), recentCategories: [], rng, config: sel })!.identity.id);
    };
    expect(run(123)).toEqual(run(123));
    expect(run(123)).not.toEqual(run(124));
  });

  it('não repete personagem na run até esgotar o conjunto elegível', () => {
    const pool = fakePool({ 1: 4, 2: 3, 3: 2 });
    const rng = createRng(99);
    const used = new Set<string>();
    let last: string | undefined;
    for (let i = 0; i < pool.length; i++) {
      const r = selectNext({ pool, round: 20, used, recentCategories: [], lastId: last, rng, config: sel })!;
      expect(r.cycleReset).toBe(false);
      expect(used.has(r.identity.id)).toBe(false);
      used.add(r.identity.id);
      last = r.identity.id;
    }
    const after = selectNext({ pool, round: 20, used, recentCategories: [], lastId: last, rng, config: sel })!;
    expect(after.cycleReset).toBe(true);
    expect(after.identity.id).not.toBe(last); // nunca repete imediatamente
  });

  it('evita a mesma categoria em sequência quando há alternativa', () => {
    const pool = fakePool({ 1: 8, 2: 0, 3: 0 });
    const rng = createRng(5);
    for (let i = 0; i < 300; i++) {
      const r = selectNext({ pool, round: 1, used: new Set(), recentCategories: ['anime', 'cartoon'], rng, config: sel })!;
      expect(['anime', 'cartoon']).not.toContain(r.identity.category);
    }
  });

  it('pool vazio ⇒ null', () => {
    expect(selectNext({ pool: [], round: 1, used: new Set(), recentCategories: [], rng: createRng(1), config: sel })).toBeNull();
  });

  it('partida real nunca usa entradas sem imagem', () => {
    const ready = new Set(['goku', 'pikachu', 'mario', 'pele', 'shrek']);
    const engine = createEngine({ catalog: CHARACTERS, isImageReady: (id) => ready.has(id), config: GAME_CONFIG });
    let state = engine.start('competitive', 2024, 0);
    const seen = new Set<string>();
    for (let i = 0; i < 60 && state.round; i++) {
      seen.add(state.round.identityId);
      state = engine.reduce(state, { type: 'skip', roundId: state.round.id, now: 1 });
      if (state.skipsLeft === 0) state = { ...state, skipsLeft: 3 };
      state = engine.reduce(state, { type: 'next', roundId: state.round!.id, now: 2 });
    }
    expect([...seen].every((id) => ready.has(id))).toBe(true);
    expect(seen.size).toBe(ready.size);
  });

  it('sem nenhuma imagem pronta, a partida real fica indisponível (não inventa conteúdo)', () => {
    const engine = createEngine({ catalog: CHARACTERS, isImageReady: () => false, config: GAME_CONFIG });
    const state = engine.start('competitive', 1, 0);
    expect(state.phase).toBe('unavailable');
    expect(state.round).toBeNull();
    expect(engine.start('preview', 1, 0).phase).toBe('playing');
  });
});
