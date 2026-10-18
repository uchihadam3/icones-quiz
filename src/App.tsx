import { useCallback, useEffect, useState } from 'react';
import type { GameMode, GameState } from './domain/engine';
import { randomSeed } from './domain/rng';
import { applyMotionPreference, resolveReducedMotion } from './lib/motion';
import { addRun, loadRecords, loadSettings, saveRecords, saveSettings, type MotionPreference, type Records } from './lib/storage';
import { GameOverScreen } from './ui/components/GameOverScreen';
import { GameScreen } from './ui/components/GameScreen';
import { HomeScreen } from './ui/components/HomeScreen';

type Screen = { name: 'home' } | { name: 'game'; mode: GameMode; seed: number } | { name: 'over'; state: GameState; newBest: boolean };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [records, setRecords] = useState<Records>(loadRecords);
  const [motion, setMotion] = useState<MotionPreference>(() => loadSettings().motion);

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

  const startGame = (mode: GameMode) => setScreen({ name: 'game', mode, seed: randomSeed() });

  const finish = useCallback(
    (state: GameState) => {
      let newBest = false;
      if (state.mode === 'competitive') {
        newBest = state.score > records.best;
        const next = addRun(records, {
          score: state.score,
          rounds: state.round?.number ?? 0,
          correct: state.stats.correct,
          bestCombo: state.stats.bestCombo,
          endedAt: new Date().toISOString(),
        });
        setRecords(next);
        saveRecords(next);
      }
      setScreen({ name: 'over', state, newBest });
    },
    [records],
  );

  const home = () => setScreen({ name: 'home' });

  return (
    <div className="app">
      <div className="aurora" aria-hidden="true" />
      <main className="shell">
        {screen.name === 'home' && (
          <HomeScreen
            records={records}
            motion={motion}
            onMotionChange={changeMotion}
            onPlay={() => startGame('competitive')}
            onPreview={() => startGame('preview')}
          />
        )}
        {screen.name === 'game' && <GameScreen key={screen.seed} mode={screen.mode} seed={screen.seed} onGameOver={finish} onQuit={home} />}
        {screen.name === 'over' && (
          <GameOverScreen state={screen.state} newBest={screen.newBest} onAgain={() => startGame(screen.state.mode)} onHome={home} />
        )}
      </main>
    </div>
  );
}
