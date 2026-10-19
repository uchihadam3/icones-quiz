import { GAME_CONFIG } from './config/gameConfig';
import { isImageReady } from './data/assets';
import summary from './data/catalog-summary.json';
import unlock from './data/unlock.json';
import { createEngine, type Engine } from './domain/engine';

/**
 * Resumo do catálogo para a tela inicial — gerado por `npm run assets:sync`, sem carregar o catálogo.
 * O modo competitivo libera sozinho quando há imagens suficientes para uma partida sem repetição
 * (limiar e justificativa em src/data/unlock.json).
 */
export const catalogSummary = {
  ...summary,
  competitiveUnlocked: summary.ready >= unlock.minReady && summary.readyLevel1 >= unlock.minReadyLevel1,
  unlock,
};

let enginePromise: Promise<Engine> | null = null;

/** Carrega o catálogo (chunk separado) e cria o motor uma única vez. */
export function loadEngine(): Promise<Engine> {
  enginePromise ??= import('./data/catalog').then(({ CATALOG }) =>
    createEngine({ catalog: CATALOG, isImageReady: (id) => isImageReady(id), config: GAME_CONFIG, timerStartsOnImage: true }),
  );
  return enginePromise;
}
