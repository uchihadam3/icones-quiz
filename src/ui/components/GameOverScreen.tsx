import { useLayoutEffect, useRef } from 'react';
import type { GameState } from '../../domain/engine';
import { fx } from '../../lib/motion';

export function GameOverScreen({
  state,
  newBest,
  onAgain,
  onHome,
}: {
  state: GameState;
  newBest: boolean;
  onAgain: () => void;
  onHome: () => void;
}) {
  const scoreRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    fx.cardIn(panelRef.current);
    fx.countTo(scoreRef.current, 0, state.score);
  }, [state.score]);
  const { stats } = state;
  const preview = state.mode === 'preview';
  const rows: [string, number][] = [
    ['Rodadas', state.round?.number ?? 0],
    ['Acertos', stats.correct],
    ['Acertos com ajuda', stats.correctWithHint],
    ['Melhor combo', stats.bestCombo],
    ['Vidas recuperadas', stats.livesRecovered],
    ['Pulos usados', stats.skips],
  ];

  return (
    <section className="screen center-screen" data-testid="gameover-screen">
      <div className="panel gameover" ref={panelRef}>
        <p className="eyebrow">Fim de jogo</p>
        {/* Texto controlado pela animação de contagem. */}
        <strong className="final-score" ref={scoreRef} data-testid="final-score" />
        {newBest && !preview && <p className="new-best">Novo recorde!</p>}
        {preview && <p className="fine-print">Partida de preview: não conta recorde.</p>}
        <dl className="stats">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="row">
          <button className="btn btn-primary" onClick={onAgain} autoFocus data-testid="again">
            Jogar de novo
          </button>
          <button className="btn btn-ghost" onClick={onHome}>
            Início
          </button>
        </div>
      </div>
    </section>
  );
}
