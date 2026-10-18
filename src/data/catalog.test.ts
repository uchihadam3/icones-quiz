import { describe, expect, it } from 'vitest';
import { answerKey, buildAnswerIndex, identityKeys } from '../domain/answers';
import { CATEGORY_LABELS, CHARACTERS } from './characters';

const PERSON_CATEGORIES = new Set(['music', 'sport', 'celebrity']);

describe('catálogo curado', () => {
  it('ids únicos, estáveis e em kebab-case', () => {
    const ids = CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('campos obrigatórios e níveis 1–3', () => {
    for (const c of CHARACTERS) {
      expect(c.names.length, c.id).toBeGreaterThan(0);
      expect(c.displayName.trim(), c.id).not.toBe('');
      expect(c.origin.trim(), c.id).not.toBe('');
      expect([1, 2, 3], c.id).toContain(c.level);
      expect(Object.keys(CATEGORY_LABELS), c.id).toContain(c.category);
    }
  });

  it('pessoas reais e personagens não se misturam por categoria', () => {
    for (const c of CHARACTERS) {
      expect(c.kind, c.id).toBe(PERSON_CATEGORIES.has(c.category) ? 'person' : 'character');
    }
  });

  it('nenhuma chave de resposta pertence a duas identidades', () => {
    const index = buildAnswerIndex(CHARACTERS);
    for (const c of CHARACTERS) {
      for (const key of identityKeys(c)) {
        expect(index.ownersOf(key), `chave "${key}"`).toEqual([c.id]);
      }
    }
  });

  it('nomes rejeitados nunca são aceitos para a própria identidade', () => {
    const index = buildAnswerIndex(CHARACTERS);
    for (const c of CHARACTERS) {
      for (const r of c.rejected ?? []) {
        expect(identityKeys(c), c.id).not.toContain(answerKey(r));
        expect(index.check(r, c.id).correct, `${c.id} rejeita "${r}"`).toBe(false);
      }
    }
  });

  it('cada identidade tem ao menos uma chave aceita', () => {
    for (const c of CHARACTERS) expect(identityKeys(c).length, c.id).toBeGreaterThan(0);
  });

  it('há ícones de todos os níveis para a curva de dificuldade', () => {
    for (const lvl of [1, 2, 3] as const) expect(CHARACTERS.some((c) => c.level === lvl)).toBe(true);
    // A maioria do catálogo deve ser nível 1–2 (ícones muito famosos), nunca dominado por nível 3.
    const lvl3 = CHARACTERS.filter((c) => c.level === 3).length;
    expect(lvl3 / CHARACTERS.length).toBeLessThan(0.25);
  });
});
