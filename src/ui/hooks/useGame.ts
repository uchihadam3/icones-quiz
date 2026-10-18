import { useCallback, useEffect, useReducer, useState } from 'react';
import { GAME_CONFIG } from '../../config/gameConfig';
import type { Engine, GameAction, GameMode } from '../../domain/engine';
import { remainingMs } from '../../domain/timer';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type UiAction = DistributiveOmit<GameAction, 'now'>;

const clock = () => performance.now();

/**
 * Liga o motor puro ao navegador: relógio, visibilidade da aba e avanço automático.
 * O motor decide tudo; aqui só entregamos `now` e ações com `roundId`.
 */
export function useGame(engine: Engine, mode: GameMode, seed: number) {
  const [state, rawDispatch] = useReducer(engine.reduce, undefined, () => engine.start(mode, seed, clock()));
  const [now, setNow] = useState(clock);
  const dispatch = useCallback((action: UiAction) => rawDispatch({ ...action, now: clock() } as GameAction), []);

  const round = state.round;
  const playing = state.phase === 'playing';

  // Relógio da rodada: re-renderiza ~10x/s e dispara o timeout (o motor ignora duplicatas).
  useEffect(() => {
    if (!playing || !round) return;
    const tick = () => {
      const t = clock();
      setNow(t);
      if (remainingMs(round.timer, t) <= 0) rawDispatch({ type: 'timeout', roundId: round.id, now: t });
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [playing, round]);

  // Sair da aba pausa a rodada; voltar exige "Continuar" (e sorteia outro ícone).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') rawDispatch({ type: 'hide', now: clock() });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Avanço automático após o feedback (rápido entre rodadas).
  const feedbackRoundId = state.phase === 'feedback' ? round?.id : undefined;
  const outcome = state.lastResolution?.outcome;
  useEffect(() => {
    if (feedbackRoundId === undefined) return;
    const delay = outcome === 'correct' || outcome === 'correct-hint' ? GAME_CONFIG.feedback.correctDelayMs : GAME_CONFIG.feedback.wrongDelayMs;
    const id = window.setTimeout(() => rawDispatch({ type: 'next', roundId: feedbackRoundId, now: clock() }), delay);
    return () => window.clearTimeout(id);
  }, [feedbackRoundId, outcome]);

  return { state, dispatch, now };
}
