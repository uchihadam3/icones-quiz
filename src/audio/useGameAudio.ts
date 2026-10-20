import { useEffect, useRef } from 'react';
import { GAME_CONFIG } from '../config/gameConfig';
import type { GameState } from '../domain/engine';
import { isFastAnswer, multiplierProgress } from '../domain/progress';
import { multiplierFor } from '../domain/scoring';
import { audio } from '.';
import { musicTarget } from './director';
import type { SfxEvent } from './types';

const cfg = GAME_CONFIG;
/** Passos da sequência de recuperação na escala pentatônica de Lá menor (em cents sobre o Lá do efeito). */
const PENTATONIC = [0, 300, 500, 700, 1000, 1200, 1500, 1700, 1900, 2200, 2400, 2700, 2900, 3100, 3400];

/**
 * Todos os gatilhos sonoros de uma partida, num só lugar.
 * Cada efeito usa uma chave (id da rodada/partida): o motor ignora repetições, então efeitos que rodam
 * de novo (StrictMode, re-render) nunca tocam o mesmo som duas vezes.
 */
export function useGameAudio(state: GameState, opts: { seed: number; best: number; warning: boolean }): void {
  const { round, phase, lastResolution: res, lives, score, fastStreak, streakBreak } = state;
  const multiplier = multiplierProgress(state.combo, cfg.scoring).current;
  const { seed, best, warning } = opts;

  // Trilha: o diretor decide o arranjo a partir do estado (com histerese).
  useEffect(() => {
    const scene = phase === 'paused' ? 'paused' : phase === 'gameover' ? 'gameover' : 'game';
    audio.setTarget(musicTarget({ scene, multiplier, lives: lives.lives, timeWarning: warning, fastStreak }));
  }, [phase, multiplier, lives.lives, warning, fastStreak]);

  useEffect(() => {
    audio.play('game-start', { key: `start-${seed}` });
  }, [seed]);

  const roundId = round?.id;
  const roundNumber = round?.number ?? 0;
  useEffect(() => {
    if (roundId !== undefined && roundNumber > 1) audio.play('round-start', { key: roundId });
  }, [roundId, roundNumber]);

  // Desfecho da rodada: som principal + camadas (vida, combo) com timing alinhado às animações.
  useEffect(() => {
    if (!res) return;
    const key = res.roundId;
    const main: Record<typeof res.outcome, SfxEvent> = {
      correct: isFastAnswer(res.score, cfg.scoring) ? 'correct-fast' : 'correct',
      'correct-hint': 'correct-hint',
      wrong: 'wrong',
      timeout: 'timeout',
      skipped: 'skip',
    };
    audio.play(main[res.outcome], { key });
    if (res.lifeLost) audio.play('life-lost', { key, delay: 0.1 });
    if (res.lifeLost && lives.lives === 1) audio.play('last-life', { key, delay: 0.85 });
    if (res.lifeGained) audio.play('life-recovered', { key, delay: 0.22 });
    if (res.outcome === 'correct' && res.comboAfter > 1) {
      const before = multiplierFor(res.comboBefore, cfg.scoring);
      const after = multiplierFor(res.comboAfter, cfg.scoring);
      if (after > before) audio.play(`tier-up-${Math.min(5, after)}` as SfxEvent, { key, delay: 0.16 });
    }
    // Sequência de recuperação: um "ping" que sobe na escala a cada acerto (a vida recuperada tem som próprio).
    if (res.outcome === 'correct' && !res.lifeGained && lives.streak > 0) {
      audio.play('recovery-step', { key, delay: 0.32, cents: PENTATONIC[(lives.streak - 1) % PENTATONIC.length] });
    }
    if (res.hintRecharged) audio.play('hint-recharge', { key, delay: res.lifeGained ? 0.9 : 0.45 });
    const brokeStreak = streakBreak?.roundId === res.roundId;
    // (Se a quebra veio da ajuda nesta rodada, o som já tocou ao abrir as alternativas.)
    if (brokeStreak && res.outcome !== 'skipped' && round?.options == null) audio.play('recovery-break', { key, delay: 0.5 });
    else if ((res.outcome === 'wrong' || res.outcome === 'timeout') && res.comboBefore >= 3) audio.play('combo-break', { key, delay: 0.25 });
    // lives.lives é lido no momento da resolução; não precisa disparar de novo quando muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res]);

  const hintOpen = round?.options != null;
  useEffect(() => {
    if (hintOpen && roundId !== undefined) audio.play('hint', { key: roundId });
  }, [hintOpen, roundId]);
  // Usar a ajuda quebra a sequência de recuperação: mesmo som da quebra, logo após o som da ajuda.
  const brokeByHint = hintOpen && streakBreak !== null && streakBreak.roundId === roundId && phase === 'playing';
  useEffect(() => {
    if (brokeByHint) audio.play('recovery-break', { key: `hint-${roundId}`, delay: 0.35 });
  }, [brokeByHint, roundId]);

  const prevPhase = useRef(phase);
  useEffect(() => {
    if (phase === 'paused' && prevPhase.current !== 'paused') audio.play('pause', { key: `pause-${roundId}` });
    if (prevPhase.current === 'paused' && phase === 'playing') audio.play('resume', { key: `resume-${roundId}` });
    prevPhase.current = phase;
  }, [phase, roundId]);

  const beatRecord = best > 0 && score > best;
  useEffect(() => {
    if (beatRecord) audio.play('record-beaten', { key: `record-${seed}` });
  }, [beatRecord, seed]);
}
