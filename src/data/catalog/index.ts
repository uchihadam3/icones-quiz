import type { Identity } from '../../domain/types';
import animation from './animation';
import anime from './anime';
import cartoon from './cartoon';
import celebrity from './celebrity';
import comics from './comics';
import filmTv from './film-tv';
import game from './game';
import music from './music';
import sport from './sport';

/** Catálogo completo. Carregado sob demanda (import dinâmico) para não pesar no bundle inicial. */
export const CATALOG: readonly Identity[] = [...anime, ...cartoon, ...animation, ...game, ...filmTv, ...comics, ...music, ...sport, ...celebrity];
