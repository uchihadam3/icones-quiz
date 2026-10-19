import { describe, expect, it } from 'vitest';
import { cuesBetween, equalPowerCurves, layerForMultiplier, musicTarget, nextGridTime, withFastBonus, type MusicSignals } from './director';

const base: MusicSignals = { scene: 'game', multiplier: 1, lives: 3, timeWarning: false, fastStreak: 0 };

describe('diretor musical', () => {
  it('menu toca a camada de menu, sem tensão', () => {
    expect(musicTarget({ ...base, scene: 'menu', lives: 1, timeWarning: true })).toEqual({ layer: 'menu', danger: 0, muffled: false });
  });

  it('intensidade acompanha o multiplicador: x1 groove, x2 build, x3–x4 hype, x5 epic', () => {
    expect([1, 2, 3, 4, 5].map(layerForMultiplier)).toEqual(['groove', 'build', 'hype', 'hype', 'epic']);
    expect(layerForMultiplier(0)).toBe('groove');
    expect(layerForMultiplier(9)).toBe('epic');
  });

  it('acertos relâmpago seguidos dão um degrau extra, mas não sem combo', () => {
    expect(withFastBonus('build', 2)).toBe('hype');
    expect(withFastBonus('hype', 3)).toBe('epic');
    expect(withFastBonus('epic', 5)).toBe('epic');
    expect(withFastBonus('groove', 4)).toBe('groove');
    expect(withFastBonus('build', 1)).toBe('build');
  });

  it('perigo: tempo acabando tem prioridade sobre última vida', () => {
    expect(musicTarget({ ...base, lives: 1 }).danger).toBe(1);
    expect(musicTarget({ ...base, timeWarning: true }).danger).toBe(2);
    expect(musicTarget({ ...base, lives: 1, timeWarning: true }).danger).toBe(2);
  });

  it('pausa e fim abafam sem trocar de arranjo nem tocar tensão', () => {
    const t = musicTarget({ ...base, scene: 'paused', multiplier: 3, lives: 1, timeWarning: true });
    expect(t).toEqual({ layer: 'hype', danger: 0, muffled: true });
  });

  it('histerese: a sequência de acertos não faz o arranjo oscilar', () => {
    // combo 1..14 com x1..x4 só sobe; nunca desce sem quebra de combo
    const multipliers = [1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5];
    let prev = musicTarget({ ...base, multiplier: multipliers[0]! });
    let downs = 0;
    for (const m of multipliers.slice(1)) {
      const next = musicTarget({ ...base, multiplier: m });
      if (cuesBetween(prev, next).includes('combo-break')) downs++;
      prev = next;
    }
    expect(downs).toBe(0);
    expect(prev.layer).toBe('epic');
  });

  it('gera deixas musicais: subida de nível, quebra de combo, entrar/sair de perigo', () => {
    const groove = musicTarget(base);
    const hype = musicTarget({ ...base, multiplier: 3 });
    expect(cuesBetween(groove, hype)).toEqual(['tier-up']);
    expect(cuesBetween(hype, groove)).toEqual(['combo-break']);
    expect(cuesBetween(groove, musicTarget({ ...base, timeWarning: true }))).toEqual(['enter-danger']);
    expect(cuesBetween(musicTarget({ ...base, lives: 1 }), groove)).toEqual(['leave-danger']);
    expect(cuesBetween(musicTarget({ ...base, scene: 'menu' }), groove)).toEqual([]);
  });

  it('quantiza transições na grade (compasso de 2 s a 120 BPM)', () => {
    expect(nextGridTime(10.0, 0, 2)).toBe(12);
    expect(nextGridTime(11.99, 0, 2)).toBe(14); // respeita a antecedência mínima
    expect(nextGridTime(3.2, 1, 0.5)).toBe(3.5);
    expect(nextGridTime(0, 5, 2)).toBe(5);
  });

  it('crossfade equal-power mantém potência constante', () => {
    const { fadeIn, fadeOut } = equalPowerCurves(64);
    for (let i = 0; i < 64; i++) expect(fadeIn[i]! ** 2 + fadeOut[i]! ** 2).toBeCloseTo(1, 5);
    expect(fadeIn[0]).toBeCloseTo(0);
    expect(fadeOut[63]).toBeCloseTo(0);
  });
});
