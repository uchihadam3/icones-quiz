import { useEffect, useLayoutEffect, useRef } from 'react';
import type { GameState } from '../../domain/engine';
import { rankFor, RANKS } from '../../domain/progress';
import { fx, haptic } from '../../lib/motion';
import { particlesFx } from '../../lib/particles';
import { CrownIcon, FlameIcon, HeartIcon, HomeIcon, OptionsIcon, RetryIcon, SkipIcon, TargetIcon, TrophyIcon } from './Icons';

export function GameOverScreen({
  state,
  newBest,
  previousBest,
  onAgain,
  onHome,
}: {
  state: GameState;
  /** Bateu o recorde (oficial em partida real; de treino no preview). */
  newBest: boolean;
  previousBest: number;
  onAgain: () => void;
  onHome: () => void;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const scoreRef = useRef<HTMLElement>(null);
  const { stats } = state;
  const preview = state.mode === 'preview';
  const correctTotal = stats.correct + stats.correctWithHint;
  const rank = rankFor(correctTotal);
  const roundsWon = correctTotal;

  useLayoutEffect(() => {
    fx.screenIn(rootRef.current);
    fx.countTo(scoreRef.current, 0, state.score, newBest ? 1.6 : 1);
  }, [state.score, newBest]);

  useEffect(() => {
    if (!newBest) return;
    haptic([30, 60, 30, 60, 80]);
    const a = window.setTimeout(() => particlesFx.cannons(70), 250);
    const b = window.setTimeout(() => particlesFx.confetti(120), 900);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [newBest]);

  const rows: { label: string; value: number; icon: React.ReactNode; tone: string }[] = [
    { label: 'Rodadas vencidas', value: roundsWon, icon: <TargetIcon />, tone: 'cyan' },
    { label: 'Acertos sem ajuda', value: stats.correct, icon: <CrownIcon />, tone: 'gold' },
    { label: 'Melhor combo', value: stats.bestCombo, icon: <FlameIcon />, tone: 'orange' },
    { label: 'Vidas de volta', value: stats.livesRecovered, icon: <HeartIcon filled />, tone: 'pink' },
    { label: 'Com ajuda', value: stats.correctWithHint, icon: <OptionsIcon />, tone: 'violet' },
    { label: 'Pulos usados', value: stats.skips, icon: <SkipIcon />, tone: 'muted' },
  ];
  const nextRank = rank.next;
  const rankFrom = rank.rank.minCorrect;
  const rankPct = nextRank ? Math.round(((correctTotal - rankFrom) / (nextRank.minCorrect - rankFrom)) * 100) : 100;

  return (
    <section className={`screen center-screen gameover-screen${newBest ? ' is-record' : ''}`} ref={rootRef} data-testid="gameover-screen">
      {newBest && (
        <div className="record-banner" data-enter data-testid="new-record">
          <span className="record-burst" aria-hidden="true" />
          <TrophyIcon className="record-banner-icon" />
          <strong>{preview ? 'Recorde de treino!' : 'Novo recorde!'}</strong>
          {previousBest > 0 && <span>+{(state.score - previousBest).toLocaleString('pt-BR')} acima da sua melhor marca</span>}
        </div>
      )}

      <div className="panel gameover" data-enter>
        <p className="eyebrow">Fim de jogo</p>
        {/* Texto controlado pela animação de contagem. */}
        <strong className="final-score" ref={scoreRef} data-testid="final-score" />
        <p className="final-sub">
          {newBest ? 'pontos — sua melhor marca!' : previousBest > 0 ? `pontos · recorde ${previousBest.toLocaleString('pt-BR')}` : 'pontos'}
        </p>

        <div className="rank" data-rank={rank.rank.id}>
          <span className="rank-medal" aria-hidden="true">
            {rank.index + 1}
          </span>
          <div className="rank-body">
            <span className="hud-label">Título da partida</span>
            <strong>{rank.rank.title}</strong>
            <div className="rank-bar" aria-hidden="true">
              <span style={{ width: `${rankPct}%` }} />
            </div>
            <span className="rank-next">
              {nextRank ? `Mais ${rank.remaining} acerto${rank.remaining === 1 ? '' : 's'} para "${nextRank.title}"` : `Título máximo de ${RANKS.length}!`}
            </span>
          </div>
        </div>

        <dl className="stats">
          {rows.map((r) => (
            <div key={r.label} className={`stat stat--${r.tone}`}>
              <span className="stat-icon" aria-hidden="true">
                {r.icon}
              </span>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>

        {preview && <p className="fine-print">Partida de preview: não conta recorde.</p>}

        <div className="gameover-actions">
          <button className="btn btn--primary btn--xl btn--shine" onClick={onAgain} autoFocus data-testid="again">
            <RetryIcon /> Jogar de novo
          </button>
          <button className="btn btn--secondary" onClick={onHome}>
            <HomeIcon /> Início
          </button>
        </div>
      </div>
    </section>
  );
}
