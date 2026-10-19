import type { Category, Identity, RecognitionLevel } from '../../domain/types';

/**
 * Linha compacta do catálogo:
 *   [id, nível, nome exibido, 'nome 1|nome 2', origem, 'apelido 1|apelido 2'?, 'rejeitado 1|…'?]
 * `kind` vem da categoria (música, esporte e celebridade = pessoa real; o resto = personagem).
 */
export type Row = readonly [
  id: string,
  level: RecognitionLevel,
  displayName: string,
  names: string,
  origin: string,
  aliases?: string,
  rejected?: string,
];

export const PERSON_CATEGORIES: ReadonlySet<Category> = new Set(['music', 'sport', 'celebrity']);

const split = (s: string | undefined) =>
  s
    ? s
        .split('|')
        .map((x) => x.trim())
        .filter(Boolean)
    : undefined;

export function rows(category: Category, list: readonly Row[]): Identity[] {
  const kind = PERSON_CATEGORIES.has(category) ? 'person' : 'character';
  return list.map(([id, level, displayName, names, origin, aliases, rejected]) => {
    const identity: Identity = { id, kind, category, level, displayName, names: split(names) ?? [], origin };
    const a = split(aliases);
    const r = split(rejected);
    if (a) identity.aliases = a;
    if (r) identity.rejected = r;
    return identity;
  });
}
