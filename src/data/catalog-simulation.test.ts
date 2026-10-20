import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../config/gameConfig';
import { createEngine, type GameState } from '../domain/engine';
import { levelWeightsFor, selectNext } from '../domain/selection';
import { createRng } from '../domain/rng';
import type { Category, RecognitionLevel } from '../domain/types';
import { CHARACTERS } from './characters';

const sel = GAME_CONFIG.selection;
const pool = CHARACTERS.filter((c) => c.active !== false);

describe('maratonas simuladas sobre o catálogo real', () => {
  it('3.000 partidas de 60 rodadas: sem repetição, curva por nível e categorias variadas', () => {
    const counts: Record<string, Record<RecognitionLevel, number>> = { early: { 1: 0, 2: 0, 3: 0 }, mid: { 1: 0, 2: 0, 3: 0 }, late: { 1: 0, 2: 0, 3: 0 } };
    let sameCategoryInARow = 0;
    let picks = 0;
    for (let run = 0; run < 3000; run++) {
      const rng = createRng(run + 1);
      const used = new Set<string>();
      const recent: Category[] = [];
      let last: string | undefined;
      for (let round = 1; round <= 60; round++) {
        const r = selectNext({ pool, round, used, recentCategories: recent, lastId: last, rng, config: sel })!;
        expect(r.cycleReset).toBe(false); // centenas de ícones: nenhuma partida de 60 rodadas repete
        expect(used.has(r.identity.id)).toBe(false);
        used.add(r.identity.id);
        if (recent[recent.length - 1] === r.identity.category) sameCategoryInARow++;
        recent.push(r.identity.category);
        last = r.identity.id;
        const band = round <= 5 ? 'early' : round <= 30 ? 'mid' : 'late';
        counts[band]![r.identity.level]++;
        picks++;
      }
    }
    const share = (band: string, lvl: RecognitionLevel) => {
      const c = counts[band]!;
      return c[lvl] / (c[1] + c[2] + c[3]);
    };
    // Rodadas 1–5: 80/20/0 configurado.
    expect(share('early', 1)).toBeCloseTo(levelWeightsFor(1, sel.levelMix)[1] / 100, 1);
    expect(share('early', 3)).toBe(0);
    // Dificuldade sobe por proporção, e nível 1 continua aparecendo no fim.
    expect(share('late', 3)).toBeGreaterThan(share('mid', 3));
    expect(share('late', 1)).toBeGreaterThan(0.15);
    // Categoria repetida em sequência é rara (evitada sempre que há alternativa).
    expect(sameCategoryInARow / picks).toBeLessThan(0.02);
  }, 60_000);

  it('maratona longa (2 catálogos inteiros) esgota o catálogo, reinicia o ciclo e nunca repete em seguida', () => {
    const rng = createRng(99);
    const used = new Set<string>();
    const recent: Category[] = [];
    let last: string | undefined;
    let resets = 0;
    const seenInCycle = new Set<string>();
    for (let round = 1; round <= pool.length * 2 + 50; round++) {
      const r = selectNext({ pool, round, used, recentCategories: recent, lastId: last, rng, config: sel })!;
      if (r.cycleReset) {
        resets++;
        expect(seenInCycle.size).toBe(pool.length); // só reinicia depois de mostrar todos
        used.clear();
        seenInCycle.clear();
      }
      expect(r.identity.id).not.toBe(last);
      used.add(r.identity.id);
      seenInCycle.add(r.identity.id);
      recent.push(r.identity.category);
      last = r.identity.id;
    }
    expect(resets).toBe(2);
  }, 60_000);

  it('escala: 2.000 identidades sintéticas, 2.000 rodadas seguidas sem repetir e sem lentidão', () => {
    const cats = [...new Set(pool.map((c) => c.category))];
    const big = Array.from({ length: 2000 }, (_, i) => ({
      ...pool[i % pool.length]!,
      id: `sintetico-${i}`,
      category: cats[i % cats.length]!,
      level: ((i % 10) < 4 ? 1 : (i % 10) < 8 ? 2 : 3) as RecognitionLevel,
    }));
    const rng = createRng(7);
    const used = new Set<string>();
    const recent: Category[] = [];
    let last: string | undefined;
    const t0 = performance.now();
    for (let round = 1; round <= big.length; round++) {
      const r = selectNext({ pool: big, round, used, recentCategories: recent, lastId: last, rng, config: sel })!;
      expect(r.cycleReset).toBe(false);
      used.add(r.identity.id);
      recent.push(r.identity.category);
      last = r.identity.id;
    }
    expect(used.size).toBe(big.length);
    // Média por sorteio abaixo de 2 ms mesmo com o catálogo inteiro na memória.
    expect((performance.now() - t0) / big.length).toBeLessThan(2);
  }, 60_000);

  it('motor completo: 200 partidas reais até o fim, sem travar nem repetir na partida', () => {
    const engine = createEngine({ catalog: CHARACTERS, isImageReady: () => true, config: GAME_CONFIG });
    for (let seed = 1; seed <= 200; seed++) {
      let s: GameState = engine.start('competitive', seed, 0);
      const seen = new Set<string>();
      let t = 0;
      // Joga bem por 40 rodadas, depois erra até acabar.
      for (let i = 0; i < 400 && s.phase !== 'gameover'; i++) {
        const round = s.round!;
        expect(seen.has(round.identityId)).toBe(false);
        seen.add(round.identityId);
        const guess = i < 40 ? engine.identity(round.identityId)!.names[0]! : 'resposta errada';
        s = engine.reduce(s, { type: 'submit', roundId: round.id, guess, now: t });
        if (s.phase === 'feedback') s = engine.reduce(s, { type: 'next', roundId: round.id, now: ++t });
      }
      expect(s.phase).toBe('gameover');
      expect(s.stats.correct).toBe(40);
    }
  }, 60_000);
});
