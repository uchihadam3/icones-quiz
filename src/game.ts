import { GAME_CONFIG } from './config/gameConfig';
import { isImageReady, readyCount } from './data/assets';
import { activeCharacters, CHARACTERS } from './data/characters';
import { createEngine } from './domain/engine';

/** Instância única do motor com o catálogo e o manifesto reais. */
export const engine = createEngine({ catalog: CHARACTERS, isImageReady: (id) => isImageReady(id), config: GAME_CONFIG, timerStartsOnImage: true });

export const catalogSummary = {
  total: activeCharacters().length,
  ready: readyCount(activeCharacters().map((c) => c.id)),
};
