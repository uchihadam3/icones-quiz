import type { Identity } from './types';

/**
 * Validação de respostas digitadas.
 *
 * Regras (ver docs/GAME_RULES.md):
 * 1. Normalização Unicode: acentos, caixa, pontuação e espaços não importam ("Pelé" = "pele", "Homem-Aranha" = "homem aranha" = "homemaranha").
 * 2. Aceita nomes e apelidos cadastrados. Prefixos arbitrários não são aceitos.
 * 3. Um palpite que é o nome (ou fica a 1 erro do nome) de OUTRA identidade nunca vale.
 * 4. Tolerância de 1 erro de teclado, mais rígida para nomes curtos:
 *    - menos de 5 letras: só exato;
 *    - 5 a 7 letras: só troca por tecla vizinha (QWERTY) ou inversão de duas letras adjacentes;
 *    - 8+ letras: qualquer 1 edição (troca, inversão, letra extra ou faltando), exceto cortar o final.
 */

const SPECIAL_LETTERS: Record<string, string> = {
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
  ø: 'o',
  ł: 'l',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ı: 'i',
};

export function normalizeAnswer(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[ßæœøłđðþı]/g, (ch) => SPECIAL_LETTERS[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Chave de comparação: normalizada e sem espaços ("spider man" = "spiderman"). */
export function answerKey(input: string): string {
  return normalizeAnswer(input).replace(/ /g, '');
}

const QWERTY_ROWS = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

const ADJACENT: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const map = new Map<string, Set<string>>();
  const pos = new Map<string, [number, number]>();
  QWERTY_ROWS.forEach((row, r) => [...row].forEach((ch, c) => pos.set(ch, [r, c])));
  for (const [ch, [r, c]] of pos) {
    const near = new Set<string>();
    for (const [other, [r2, c2]] of pos) {
      if (other === ch) continue;
      // Linhas do teclado são deslocadas ~meia tecla; vizinhas diagonais ficam em c e c±1.
      if (r2 === r && Math.abs(c2 - c) === 1) near.add(other);
      if (Math.abs(r2 - r) === 1 && (c2 === c || c2 === c - 1 || c2 === c + 1)) near.add(other);
    }
    map.set(ch, near);
  }
  return map;
})();

export function areAdjacentKeys(a: string, b: string): boolean {
  return ADJACENT.get(a)?.has(b) ?? false;
}

export type Edit =
  | { type: 'equal' }
  | { type: 'substitute'; from: string; to: string }
  | { type: 'transpose' }
  | { type: 'insert' }
  | { type: 'delete'; truncation: boolean };

/** Descreve a diferença entre `target` e `guess` se for no máximo 1 edição (Damerau). Senão, null. */
export function singleEdit(target: string, guess: string): Edit | null {
  if (target === guess) return { type: 'equal' };
  const lt = target.length;
  const lg = guess.length;
  if (lt === lg) {
    const diffs: number[] = [];
    for (let i = 0; i < lt; i++) {
      if (target[i] !== guess[i]) {
        diffs.push(i);
        if (diffs.length > 2) return null;
      }
    }
    if (diffs.length === 1) {
      const i = diffs[0] as number;
      return { type: 'substitute', from: target[i] as string, to: guess[i] as string };
    }
    if (diffs.length === 2) {
      const [i, j] = diffs as [number, number];
      if (j === i + 1 && target[i] === guess[j] && target[j] === guess[i]) return { type: 'transpose' };
    }
    return null;
  }
  if (Math.abs(lt - lg) !== 1) return null;
  const longer = lt > lg ? target : guess;
  const shorter = lt > lg ? guess : target;
  let i = 0;
  while (i < shorter.length && longer[i] === shorter[i]) i++;
  if (longer.slice(i + 1) !== shorter.slice(i)) return null;
  if (lg > lt) return { type: 'insert' };
  return { type: 'delete', truncation: target.startsWith(guess) };
}

export function isAcceptableTypo(target: string, guess: string): boolean {
  const edit = singleEdit(target, guess);
  if (!edit || edit.type === 'equal') return false;
  const len = target.length;
  if (len < 5) return false;
  if (len <= 7) {
    if (edit.type === 'transpose') return true;
    return edit.type === 'substitute' && areAdjacentKeys(edit.from, edit.to);
  }
  if (edit.type === 'delete' && edit.truncation) return false;
  return true;
}

export type MatchVerdict =
  | { correct: true; how: 'exact' | 'typo' }
  | { correct: false; reason: 'empty' | 'other-identity' | 'rejected' | 'ambiguous' | 'no-match' };

export interface AnswerIndex {
  check(guess: string, targetId: string): MatchVerdict;
  /** Chaves aceitas de uma identidade (para testes e ferramentas de curadoria). */
  keysOf(id: string): readonly string[];
  /** Identidades que possuem a chave exata. */
  ownersOf(key: string): readonly string[];
}

export function identityKeys(identity: Identity): string[] {
  const rejected = new Set((identity.rejected ?? []).map(answerKey));
  const keys = [...identity.names, ...(identity.aliases ?? [])].map(answerKey).filter((k) => k && !rejected.has(k));
  return [...new Set(keys)];
}

export function buildAnswerIndex(identities: readonly Identity[]): AnswerIndex {
  const keysById = new Map<string, string[]>();
  const rejectedById = new Map<string, Set<string>>();
  const owners = new Map<string, string[]>();
  for (const identity of identities) {
    const keys = identityKeys(identity);
    keysById.set(identity.id, keys);
    rejectedById.set(identity.id, new Set((identity.rejected ?? []).map(answerKey)));
    for (const key of keys) owners.set(key, [...(owners.get(key) ?? []), identity.id]);
  }
  const allEntries = [...keysById.entries()];

  return {
    keysOf: (id) => keysById.get(id) ?? [],
    ownersOf: (key) => owners.get(key) ?? [],
    check(guess, targetId) {
      const key = answerKey(guess);
      if (!key) return { correct: false, reason: 'empty' };
      const targetKeys = keysById.get(targetId) ?? [];
      if (rejectedById.get(targetId)?.has(key)) return { correct: false, reason: 'rejected' };
      if (targetKeys.includes(key)) return { correct: true, how: 'exact' };
      if ((owners.get(key) ?? []).some((id) => id !== targetId)) return { correct: false, reason: 'other-identity' };

      if (!targetKeys.some((k) => isAcceptableTypo(k, key))) return { correct: false, reason: 'no-match' };
      // Um erro de digitação só vale se não puder ser lido como outra identidade.
      const nearOther = allEntries.some(
        ([id, keys]) => id !== targetId && keys.some((k) => singleEdit(k, key) !== null),
      );
      if (nearOther) return { correct: false, reason: 'ambiguous' };
      return { correct: true, how: 'typo' };
    },
  };
}
