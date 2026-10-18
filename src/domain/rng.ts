import type { Rng } from './types';

/** PRNG determinístico (mulberry32) para testes e seeds reproduzíveis. */
export function createRng(seed: number): Rng {
  return statefulRng(seed).rng;
}

/** Variante que expõe o estado interno, para reducers puros guardarem o RNG no estado do jogo. */
export function statefulRng(seed: number): { rng: Rng; state: () => number } {
  let a = seed >>> 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { rng, state: () => a };
}

export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now();
  }
  return Date.now() >>> 0;
}

export function pickIndex(length: number, rng: Rng): number {
  return Math.min(length - 1, Math.floor(rng() * length));
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, rng);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Escolhe uma chave por peso; ignora pesos <= 0. Retorna undefined se nada tiver peso. */
export function pickWeighted<K extends string | number>(weights: ReadonlyArray<[K, number]>, rng: Rng): K | undefined {
  const valid = weights.filter(([, w]) => w > 0);
  const total = valid.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return undefined;
  let roll = rng() * total;
  for (const [key, w] of valid) {
    roll -= w;
    if (roll < 0) return key;
  }
  return valid[valid.length - 1]?.[0];
}
