import { useCallback, useEffect, useState } from 'react';
import type { Engine, GameMode, GameState } from './domain/engine';
import { randomSeed } from './domain/rng';
import { loadEngine } from './game';
import { applyMotionPreference, resolveReducedMotion } from './lib/motion';
import { attachParticleCanvas, particlesFx } from './lib/particles';
import {
  addPracticeRun,
  addRun,
  loadRecords,
  loadSettings,
  saveRecords,
  saveSettings,
  type MotionPreference,
  type Records,
} from './lib/storage';
import { GameOverScreen } from './ui/components/GameOverScreen';
import { GameScreen } from './ui/components/GameScreen';
import { HomeScreen } from './ui/components/HomeScreen';

type Screen =
  | { name: 'home' }
  | { name: 'game'; mode: GameMode; seed: number }
  | { name: 'over'; state: GameState; newBest: boolean; previousBest: number };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [records, setRecords] = useState<Records>(loadRecords);
  const [motion, setMotion] = useState<MotionPreference>(() => loadSettings().motion);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [starting, setStarting] = useState(false);

  // Pré-carrega o catálogo (chunk separado) quando o navegador estiver ocioso: o clique em "Jogar" fica instantâneo.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const run = () => void loadEngine().then(setEngine, () => {});
    if (w.requestIdleCallback) w.requestIdleCallback(run);
    else window.setTimeout(run, 1200);
  }, []);

  useEffect(() => {
    const apply = () => applyMotionPreference(resolveReducedMotion(motion));
    apply();
    const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    mq?.addEventListener('change', apply);
    return () => mq?.removeEventListener('change', apply);
  }, [motion]);

  const changeMotion = (m: MotionPreference) => {
    setMotion(m);
    saveSettings({ motion: m });
  };

  const go = (next: Screen) => {
    particlesFx.clear();
    window.scrollTo({ top: 0 });
    setScreen(next);
  };

  const startGame = async (mode: GameMode) => {
    if (starting) return;
    setStarting(true);
    try {
      setEngine(await loadEngine());
      go({ name: 'game', mode, seed: randomSeed() });
    } finally {
      setStarting(false);
    }
  };

  const finish = useCallback(
    (state: GameState) => {
      const competitive = state.mode === 'competitive';
      const previousBest = competitive ? records.best : records.practiceBest;
      const newBest = state.score > 0 && state.score > previousBest;
      const next = competitive
        ? addRun(records, {
            score: state.score,
            rounds: state.round?.number ?? 0,
            correct: state.stats.correct,
            bestCombo: state.stats.bestCombo,
            endedAt: new Date().toISOString(),
          })
        : addPracticeRun(records, state.score);
      setRecords(next);
      saveRecords(next);
      setScreen({ name: 'over', state, newBest, previousBest });
    },
    [records],
  );

  const home = () => go({ name: 'home' });

  return (
    <div className="app">
      <div className="backdrop" aria-hidden="true">
        <span className="backdrop-aurora" />
        <span className="backdrop-grid" />
        <span className="backdrop-stars" />
        <span className="backdrop-vignette" />
      </div>
      <canvas className="fx-canvas" ref={attachParticleCanvas} aria-hidden="true" />
      <main className="shell" data-screen={screen.name}>
        {screen.name === 'home' && (
          <HomeScreen
            records={records}
            motion={motion}
            onMotionChange={changeMotion}
            starting={starting}
            onPlay={() => void startGame('competitive')}
            onPreview={() => void startGame('preview')}
          />
        )}
        {screen.name === 'game' && engine && (
          <GameScreen
            key={screen.seed}
            engine={engine}
            mode={screen.mode}
            seed={screen.seed}
            best={screen.mode === 'competitive' ? records.best : records.practiceBest}
            onGameOver={finish}
            onQuit={home}
          />
        )}
        {screen.name === 'over' && (
          <GameOverScreen
            state={screen.state}
            newBest={screen.newBest}
            previousBest={screen.previousBest}
            onAgain={() => void startGame(screen.state.mode)}
            onHome={home}
          />
        )}
      </main>
    </div>
  );
}
