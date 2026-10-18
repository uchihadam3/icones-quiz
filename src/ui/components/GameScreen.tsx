import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { GAME_CONFIG } from '../../config/gameConfig';
import { currentMultiplier, recoveryView, roundRemainingMs, type GameMode, type GameState, type Resolution } from '../../domain/engine';
import type { Identity } from '../../domain/types';
import { engine } from '../../game';
import { fx } from '../../lib/motion';
import { useGame } from '../hooks/useGame';
import { usePreload } from '../hooks/usePreload';
import { ChallengeImage } from './ChallengeImage';
import { Hearts, Multiplier, RecoveryMeter, Score, TimerRing } from './Hud';
import { OptionsIcon, PauseIcon, SkipIcon } from './Icons';

const cfg = GAME_CONFIG;

export function GameScreen({ mode, seed, onGameOver, onQuit }: { mode: GameMode; seed: number; onGameOver: (state: GameState) => void; onQuit: () => void }) {
  const { state, dispatch, now } = useGame(engine, mode, seed);
  const { round, phase } = state;
  const identity = round ? engine.identity(round.identityId) : undefined;
  const preview = mode === 'preview';
  usePreload(state.upcoming?.id);

  useEffect(() => {
    if (phase === 'gameover') {
      const id = window.setTimeout(() => onGameOver(state), cfg.feedback.wrongDelayMs);
      return () => window.clearTimeout(id);
    }
  }, [phase, state, onGameOver]);

  const roundId = round?.id;
  const onImageFailed = useCallback(() => {
    if (roundId !== undefined) dispatch({ type: 'imageFailed', roundId });
  }, [dispatch, roundId]);
  const onImageShown = useCallback(() => {
    if (roundId !== undefined) dispatch({ type: 'imageShown', roundId });
  }, [dispatch, roundId]);

  if (phase === 'unavailable' || !round || !identity) {
    return (
      <section className="screen center-screen">
        <div className="panel">
          <h2>Banco de imagens em preparação</h2>
          <p>Não há ícones com imagem disponível para continuar esta partida.</p>
          <button className="btn btn-primary" onClick={onQuit}>
            Voltar ao início
          </button>
        </div>
      </section>
    );
  }

  const recovery = recoveryView(state, cfg);
  const remaining = phase === 'playing' || phase === 'paused' ? roundRemainingMs(state, now) : 0;
  const resolution = phase === 'feedback' || phase === 'gameover' ? state.lastResolution : null;
  const resolvedHere = resolution && resolution.roundId === round.id ? resolution : null;
  const canAct = phase === 'playing';

  return (
    <section className="screen game-screen" data-phase={phase} data-testid="game-screen">
      <header className="hud">
        <Hearts lives={state.lives.lives} max={cfg.lives.max} />
        <Score value={state.score} />
        <Multiplier value={currentMultiplier(state, cfg)} combo={state.combo} max={cfg.scoring.maxMultiplier} />
      </header>

      <div className="subhud">
        <span className="round-chip" data-testid="round">
          Rodada <b>{round.number}</b>
        </span>
        <RecoveryMeter {...recovery} />
        <button className="icon-btn" onClick={() => dispatch({ type: 'hide' })} disabled={!canAct} aria-label="Pausar">
          <PauseIcon />
        </button>
      </div>

      {preview && <p className="preview-banner">Preview de desenvolvimento · não conta recorde</p>}

      <div className="stage">
        <RoundCard
          key={round.id}
          identity={identity}
          preview={preview}
          onImageFailed={onImageFailed}
          onImageShown={onImageShown}
          hidden={phase === 'paused'}
        >
          {phase === 'playing' && (
            <TimerRing remainingMs={remaining} durationMs={round.timer.durationMs} warningSeconds={cfg.timer.warningSeconds} />
          )}
          {resolvedHere && <FeedbackBanner resolution={resolvedHere} />}
        </RoundCard>

        {phase === 'paused' && (
          <div className="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
            <h2 id="pause-title">Pausado</h2>
            <p>
              Ao continuar, um <b>novo ícone</b> é sorteado e você <b>não perde vida</b>. O combo e a sequência para recuperar vida
              recomeçam do zero.
            </p>
            <button className="btn btn-primary" autoFocus onClick={() => dispatch({ type: 'resume' })}>
              Continuar
            </button>
            <button className="btn btn-ghost" onClick={onQuit}>
              Sair da partida
            </button>
          </div>
        )}
      </div>

      <footer className="controls">
        <p className="prompt" id="prompt">
          {identity.kind === 'person' ? 'Quem é esta pessoa?' : 'Quem é este personagem?'}
        </p>

        {round.options ? (
          <OptionsPanel
            key={`opts-${round.id}`}
            options={round.options.map((id) => engine.identity(id)!).filter(Boolean)}
            disabled={!canAct}
            onPick={(optionId) => dispatch({ type: 'pickOption', roundId: round.id, optionId })}
          />
        ) : (
          <AnswerForm
            roundId={round.id}
            disabled={!canAct}
            onSubmit={(guess) => dispatch({ type: 'submit', roundId: round.id, guess })}
          />
        )}

        {phase === 'feedback' ? (
          <button className="btn btn-next" onClick={() => dispatch({ type: 'next', roundId: round.id })} data-testid="next">
            Próximo <kbd>Enter</kbd>
          </button>
        ) : (
          <div className="aids">
            <button
              className="btn btn-aid"
              disabled={!canAct || state.skipsLeft <= 0}
              onClick={() => dispatch({ type: 'skip', roundId: round.id })}
              aria-label={`Pular, ${state.skipsLeft} restantes`}
            >
              <SkipIcon /> Pular <span className="badge">{state.skipsLeft}</span>
            </button>
            <button
              className="btn btn-aid"
              disabled={!canAct || state.hintsLeft <= 0 || round.options !== null}
              onClick={() => dispatch({ type: 'useHint', roundId: round.id })}
              aria-label={`Mostrar 3 alternativas, ${state.hintsLeft} restantes`}
            >
              <OptionsIcon /> Alternativas <span className="badge">{state.hintsLeft}</span>
            </button>
          </div>
        )}
        <EnterToAdvance active={phase === 'feedback'} onNext={() => dispatch({ type: 'next', roundId: round.id })} />
      </footer>
    </section>
  );
}

function RoundCard({
  identity,
  preview,
  hidden,
  onImageFailed,
  onImageShown,
  children,
}: {
  identity: Identity;
  preview: boolean;
  hidden: boolean;
  onImageFailed: () => void;
  onImageShown: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => fx.cardIn(ref.current), []);
  return (
    <div className="card" ref={ref} data-testid="challenge-card">
      {hidden ? <div className="image-hidden" aria-hidden="true" /> : <ChallengeImage identity={identity} preview={preview} onFailed={onImageFailed} onShown={onImageShown} />}
      {children}
    </div>
  );
}

function AnswerForm({ roundId, disabled, onSubmit }: { roundId: number; disabled: boolean; onSubmit: (guess: string) => void }) {
  const [value, setValue] = useState('');
  const [valueRound, setValueRound] = useState(roundId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Nova rodada: limpa o campo (durante o render, sem efeito em cascata)…
  if (valueRound !== roundId) {
    setValueRound(roundId);
    setValue('');
  }
  // …e mantém o foco sem fechar o teclado móvel (o input nunca é desmontado entre rodadas).
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [roundId]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled || !value.trim()) return;
    onSubmit(value);
  };

  return (
    <form className="answer" onSubmit={submit} autoComplete="off">
      <input
        ref={inputRef}
        className="answer-input"
        type="text"
        inputMode="text"
        enterKeyHint="send"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        aria-labelledby="prompt"
        placeholder="Digite o nome…"
        value={value}
        readOnly={disabled}
        onChange={(e) => setValue(e.target.value)}
        data-testid="answer-input"
      />
      <button className="btn btn-primary answer-submit" type="submit" disabled={disabled || !value.trim()}>
        Responder
      </button>
    </form>
  );
}

function OptionsPanel({ options, disabled, onPick }: { options: Identity[]; disabled: boolean; onPick: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    fx.slideUp(ref.current);
    ref.current?.querySelector('button')?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      const opt = options[n - 1];
      if (!disabled && opt) {
        e.preventDefault();
        onPick(opt.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, disabled, onPick]);
  return (
    <div className="options" ref={ref} role="group" aria-label="Alternativas">
      {options.map((o, i) => (
        <button key={o.id} className="btn btn-option" disabled={disabled} onClick={() => onPick(o.id)}>
          <kbd>{i + 1}</kbd> {o.displayName}
        </button>
      ))}
    </div>
  );
}

function FeedbackBanner({ resolution }: { resolution: Resolution }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => fx.slideUp(ref.current), []);
  const name = engine.identity(resolution.identityId)?.displayName ?? '';
  const { outcome, score } = resolution;
  const good = outcome === 'correct' || outcome === 'correct-hint';
  const title =
    outcome === 'correct' ? 'Acertou!' : outcome === 'correct-hint' ? 'Acertou com ajuda' : outcome === 'timeout' ? 'Tempo esgotado' : outcome === 'skipped' ? 'Pulou' : 'Não foi dessa vez';
  return (
    <div ref={ref} className={`feedback is-${good ? 'good' : outcome === 'skipped' ? 'neutral' : 'bad'}`} role="status" data-testid="feedback">
      <strong className="feedback-title">{title}</strong>
      <span className="feedback-name">{good ? name : `Era ${name}`}</span>
      <span className="feedback-meta">
        {score.total > 0 && <b>+{score.total.toLocaleString('pt-BR')}</b>}
        {score.multiplier > 1 && <span> · x{score.multiplier}</span>}
        {resolution.lifeLost && <span className="tag tag-bad">−1 vida</span>}
        {resolution.lifeGained && <span className="tag tag-good">+1 vida</span>}
      </span>
    </div>
  );
}

function EnterToAdvance({ active, onNext }: { active: boolean; onNext: () => void }) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.repeat) {
        e.preventDefault();
        onNext();
      }
    };
    // Adia um tick para que o mesmo Enter que respondeu não avance a rodada.
    const id = window.setTimeout(() => window.addEventListener('keydown', onKey), 150);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [active, onNext]);
  return null;
}
