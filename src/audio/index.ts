import manifest from './audio-manifest.json';
import { AudioEngine } from './engine';
import type { AudioManifest } from './types';

const DEBUG_FLAG = 'icones-quiz:audio-debug';

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Registro de eventos sonoros para testes E2E (ativado por flag no localStorage). */
function debugLog(entry: string) {
  try {
    if (storage()?.getItem(DEBUG_FLAG) !== '1') return;
    const w = window as Window & { __iconesAudioLog?: string[] };
    (w.__iconesAudioLog ??= []).push(entry);
  } catch {
    // ignorar
  }
}

/** Instância única do motor de áudio (nunca recriada por render). */
export const audio = new AudioEngine({
  manifest: manifest as AudioManifest,
  baseUrl: import.meta.env.BASE_URL,
  storage: storage(),
  onLog: debugLog,
});

export type { SfxEvent } from './types';
