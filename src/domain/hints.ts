import { answerKey } from './answers';
import { shuffle } from './rng';
import type { Identity, Rng } from './types';

/**
 * Ajuda "alternativas": a correta + distratores plausíveis.
 * - Distratores sempre do mesmo tipo (personagem × pessoa) para não entregar a resposta.
 * - Prioriza a mesma categoria; completa com outras categorias do mesmo tipo.
 * - Ordem embaralhada pelo RNG injetado (a correta não fica numa posição fixa).
 */
export function buildOptions(target: Identity, catalog: readonly Identity[], count: number, rng: Rng): Identity[] {
  const targetName = answerKey(target.displayName);
  const others = catalog.filter(
    (c) => c.id !== target.id && c.kind === target.kind && c.active !== false && answerKey(c.displayName) !== targetName,
  );
  const sameCategory = shuffle(
    others.filter((c) => c.category === target.category),
    rng,
  );
  const otherCategory = shuffle(
    others.filter((c) => c.category !== target.category),
    rng,
  );
  const distractors = [...sameCategory, ...otherCategory].slice(0, Math.max(0, count - 1));
  return shuffle([target, ...distractors], rng);
}
