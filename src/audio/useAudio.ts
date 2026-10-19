import { useEffect, useSyncExternalStore } from 'react';
import { audio } from '.';
import type { AudioSettings } from './types';

/** Preferências de áudio reativas (volume, mudo) + estado de desbloqueio. */
export function useAudioSettings(): { settings: AudioSettings; unlocked: boolean; available: boolean } {
  const settings = useSyncExternalStore(
    (cb) => audio.subscribe(cb),
    () => settingsSnapshot(),
  );
  return settings;
}

let cache: { settings: AudioSettings; unlocked: boolean; available: boolean } | null = null;
function settingsSnapshot() {
  const next = { settings: audio.getSettings(), unlocked: audio.unlocked, available: audio.available };
  if (
    cache &&
    cache.unlocked === next.unlocked &&
    cache.available === next.available &&
    cache.settings.music === next.settings.music &&
    cache.settings.sfx === next.settings.sfx &&
    cache.settings.muted === next.settings.muted
  ) {
    return cache;
  }
  cache = next;
  return next;
}

/**
 * Liga o áudio ao navegador: desbloqueia no primeiro gesto (política de autoplay),
 * suspende com a aba escondida e toca um "toque" leve em botões.
 */
export function useAudioLifecycle(): void {
  useEffect(() => {
    const unlock = () => void audio.unlock();
    const onPointer = (e: PointerEvent | KeyboardEvent) => {
      unlock();
      const target = e.target instanceof Element ? e.target.closest('button:not(:disabled), [role="radio"], label') : null;
      if (target && e.type === 'pointerdown') audio.play('ui-tap');
    };
    const onVisibility = () => void audio.setHidden(document.visibilityState === 'hidden');
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onPointer, true);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onPointer, true);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
