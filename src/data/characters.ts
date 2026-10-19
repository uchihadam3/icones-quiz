import type { Identity } from '../domain/types';
import { CATALOG } from './catalog';

/**
 * Catálogo curado de identidades (ver src/data/catalog/*.ts).
 *
 * Critério de entrada: SOMENTE ícones extremamente famosos, famosos ou claramente reconhecíveis
 * para o público brasileiro e global. Nada de preencher volume com obscuridades.
 *
 * - `id` é estável e nunca reutilizado; também é a chave do manifesto de imagens.
 * - `names`/`aliases` são aceitos; `rejected` documenta nomes ambíguos que NÃO valem.
 * - Uma chave normalizada nunca pode pertencer a duas identidades (ver catalog.test.ts).
 *
 * ATENÇÃO: importar este módulo traz o catálogo inteiro. No app, use `loadCatalog()` (import dinâmico).
 */
export const CHARACTERS: readonly Identity[] = CATALOG;

export { CATEGORY_LABELS } from './categories';

export function activeCharacters(catalog: readonly Identity[] = CHARACTERS): Identity[] {
  return catalog.filter((c) => c.active !== false);
}
