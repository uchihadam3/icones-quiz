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

/** Personagem live-action ↔ ator do papel icônico: nunca os dois no catálogo (foto teria duas respostas). */
export const ACTOR_CHARACTER_CONFLICTS: readonly [string, string][] = [
  ['han-solo', 'Harrison Ford'],
  ['indiana-jones', 'Harrison Ford'],
  ['luke-skywalker', 'Mark Hamill'],
  ['jack-sparrow', 'Johnny Depp'],
  ['harry-potter', 'Daniel Radcliffe'],
  ['hermione-granger', 'Emma Watson'],
  ['rony-weasley', 'Rupert Grint'],
  ['gandalf', 'Ian McKellen'],
  ['legolas', 'Orlando Bloom'],
  ['mr-bean', 'Rowan Atkinson'],
  ['capitao-nascimento', 'Wagner Moura'],
  ['rocky-balboa', 'Sylvester Stallone'],
  ['wolverine', 'Hugh Jackman'],
  ['mulher-maravilha', 'Gal Gadot'],
  ['thor', 'Chris Hemsworth'],
  ['homem-de-ferro', 'Robert Downey Jr.'],
  ['arlequina', 'Margot Robbie'],
  ['eleven', 'Millie Bobby Brown'],
  ['wandinha-addams', 'Jenna Ortega'],
  ['walter-white', 'Bryan Cranston'],
  ['sheldon-cooper', 'Jim Parsons'],
  ['marty-mcfly', 'Michael J. Fox'],
  ['doc-brown', 'Christopher Lloyd'],
  ['spock', 'Leonard Nimoy'],
  ['daenerys', 'Emilia Clarke'],
  ['jon-snow', 'Kit Harington'],
  ['chaves', 'Roberto Gómez Bolaños'],
  ['james-bond', 'Daniel Craig'],
];

const GENERIC = ['eu', 'sim', 'nao', 'ok', 'personagem', 'pessoa', 'ator', 'atriz', 'cantor', 'cantora', 'jogador', 'heroi', 'vilao', 'teste', 'ninguem', 'nada'];

describe('curadoria', () => {
  it('não inclui ao mesmo tempo um personagem live-action e o ator do papel', () => {
    const keys = new Set(CHARACTERS.flatMap(identityKeys));
    const ids = new Set(CHARACTERS.map((c) => c.id));
    for (const [characterId, actor] of ACTOR_CHARACTER_CONFLICTS) {
      if (!ids.has(characterId)) continue;
      expect(keys.has(answerKey(actor)), `${actor} conflita com ${characterId}`).toBe(false);
    }
  });

  it('sem respostas genéricas demais (exceto "L", nome próprio do personagem)', () => {
    for (const c of CHARACTERS) {
      for (const key of identityKeys(c)) {
        expect(GENERIC, `${c.id}: "${key}"`).not.toContain(key);
        if (key.length < 2) expect(c.id, `${c.id}: chave de 1 letra`).toBe('l-death-note');
      }
    }
  });

  it('maioria do catálogo nos níveis 1 e 2; nível 3 nunca domina nenhuma categoria', () => {
    const n3 = CHARACTERS.filter((c) => c.level === 3).length;
    expect(n3 / CHARACTERS.length).toBeLessThan(0.2);
    const cats = new Set(CHARACTERS.map((c) => c.category));
    for (const cat of cats) {
      const list = CHARACTERS.filter((c) => c.category === cat);
      expect(list.filter((c) => c.level === 3).length / list.length, cat).toBeLessThan(0.5);
    }
  });

  it('catálogo grande e equilibrado entre categorias', () => {
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(500);
    const cats = new Set(CHARACTERS.map((c) => c.category));
    for (const cat of cats) expect(CHARACTERS.filter((c) => c.category === cat).length, cat).toBeGreaterThanOrEqual(35);
  });
});
