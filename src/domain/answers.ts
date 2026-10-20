import type { Identity } from './types';

/**
 * Validação de respostas digitadas.
 *
 * Regras (ver docs/GAME_RULES.md):
 * 1. Normalização Unicode: acentos, caixa, pontuação e espaços não importam ("Pelé" = "pele", "Homem-Aranha" = "homem aranha" = "homemaranha").
 * 2. Aceita nomes e apelidos cadastrados. Prefixos arbitrários não são aceitos.
 * 3. Um palpite que é o nome (ou fica a 1 erro do nome) de OUTRA identidade nunca vale.
 * 4. Tolerância a erros de digitação, mais rígida para nomes curtos:
 *    - menos de 5 letras: só exato;
 *    - 5 a 7 letras: troca por tecla vizinha (QWERTY), inversão de duas letras adjacentes ou letra
 *      dobrada a mais/a menos ("Pikachuu", "Snop");
 *    - 8+ letras: qualquer 1 edição (troca, inversão, letra extra ou faltando), exceto cortar o final —
 *      a não ser que a letra cortada seja a repetição da anterior ("Snoop Dog" → Snoop Dogg);
 *    - 9+ letras: até 2 edições, desde que o palpite não seja um começo do nome ("Michael Jacks" não vale)
 *      e tenha pelo menos 80% do tamanho.
 *    Em todos os casos, o palpite não pode estar tão perto (mesma distância ou menos) de outra identidade.
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

/** Letra extra/faltando que só repete a vizinha ("pikachuu", "dogg" → "dog"). */
function isDoubledLetterEdit(target: string, guess: string): boolean {
  const longer = target.length > guess.length ? target : guess;
  const shorter = target.length > guess.length ? guess : target;
  let i = 0;
  while (i < shorter.length && longer[i] === shorter[i]) i++;
  const ch = longer[i];
  return ch !== undefined && (longer[i - 1] === ch || longer[i + 1] === ch);
}

/** Distância de edição (Damerau restrita) com limite: devolve `max + 1` assim que passar do limite. */
export function boundedDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min((prev[j] as number) + 1, (cur[j - 1] as number) + 1, (prev[j - 1] as number) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, (prev2[j - 2] as number) + 1);
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return Math.min(prev[b.length] as number, max + 1);
}

/** Quantas edições a tolerância admite entre `target` e `guess` (0 = não é um erro aceitável). */
export function typoTolerance(target: string, guess: string): 0 | 1 | 2 {
  const len = target.length;
  if (len < 5 || target === guess) return 0;
  const edit = singleEdit(target, guess);
  if (edit) {
    if (len <= 7) {
      if (edit.type === 'transpose') return 1;
      if (edit.type === 'substitute') return areAdjacentKeys(edit.from, edit.to) ? 1 : 0;
      return isDoubledLetterEdit(target, guess) ? 1 : 0;
    }
    if (edit.type === 'delete' && edit.truncation) return isDoubledLetterEdit(target, guess) ? 1 : 0;
    return 1;
  }
  if (len >= 9 && guess.length >= Math.ceil(len * 0.8) && !target.startsWith(guess) && boundedDistance(target, guess, 2) === 2) return 2;
  return 0;
}

export function isAcceptableTypo(target: string, guess: string): boolean {
  return typoTolerance(target, guess) > 0;
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
  /**
   * Correção ortográfica sem spoiler: a grafia certa de UM nome do catálogo do qual o palpite é um erro
   * tolerado (mesmas regras da aceitação), ou null. Independe da resposta da rodada; nunca completa
   * prefixos nem palpites curtos; null se o palpite já é um nome exato ou se houver mais de um candidato.
   */
  suggest(guess: string): string | null;
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
  // Grafia original de cada chave (para mostrar "Snoop Dogg", não "snoopdogg").
  const spelling = new Map<string, string>();
  for (const identity of identities) {
    for (const name of [...identity.names, ...(identity.aliases ?? [])]) {
      const key = answerKey(name);
      if (key && !spelling.has(key)) spelling.set(key, name);
    }
  }

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

      const tolerance = Math.min(...targetKeys.map((k) => typoTolerance(k, key) || 99));
      if (tolerance === 99) return { correct: false, reason: 'no-match' };
      // Um erro de digitação só vale se não puder ser lido como outra identidade (à mesma distância ou menos).
      const nearOther = allEntries.some(
        ([id, keys]) => id !== targetId && keys.some((k) => boundedDistance(k, key, tolerance) <= tolerance),
      );
      if (nearOther) return { correct: false, reason: 'ambiguous' };
      return { correct: true, how: 'typo' };
    },
    suggest(guess) {
      const key = answerKey(guess);
      if (key.length < 5 || owners.has(key)) return null;
      let best: { id: string; key: string; tolerance: number } | null = null;
      for (const [id, keys] of allEntries) {
        for (const k of keys) {
          const tolerance = typoTolerance(k, key);
          if (tolerance === 0) continue;
          if (best && best.id !== id) return null; // dois candidatos: ambíguo, não sugere
          if (!best || tolerance < best.tolerance) best = { id, key: k, tolerance };
        }
      }
      if (!best) return null;
      const chosen = best;
      // Mesma proteção da aceitação: nenhuma outra identidade tão perto quanto a sugerida.
      const nearOther = allEntries.some(([id, keys]) => id !== chosen.id && keys.some((k) => boundedDistance(k, key, chosen.tolerance) <= chosen.tolerance));
      return nearOther ? null : (spelling.get(chosen.key) ?? null);
    },
  };
}
