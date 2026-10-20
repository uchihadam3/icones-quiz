import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { GAME_CONFIG } from '../../config/gameConfig';
import { hintRechargeView, recoveryView, roundRemainingMs, type Engine, type GameMode, type GameState, type Resolution } from '../../domain/engine';
import { heatLevel, isFastAnswer, multiplierProgress } from '../../domain/progress';
import { multiplierFor } from '../../domain/scoring';
import type { Identity } from '../../domain/types';
import { fx, haptic } from '../../lib/motion';
import { particlesFx, PALETTES } from '../../lib/particles';
import { useGame } from '../hooks/useGame';
import { usePreload } from '../hooks/usePreload';
import { useGameAudio } from '../../audio/useGameAudio';
import { ChallengeImage } from './ChallengeImage';
import { MuteButton, SoundControls } from './SoundControls';
import { Hearts, HintCharges, Multiplier, RecoveryStrip, RoundBadge, Score, StreakChip, TimeFuse, TimerRing } from './Hud';
import { BoltIcon, CameraIcon, ClockIcon, HeartIcon, HomeIcon, MaskIcon, OptionsIcon, PauseIcon, PlayIcon, SkipIcon, SparkIcon, SpellIcon } from './Icons';

const cfg = GAME_CONFIG;

export function GameScreen({
  engine,
  mode,
  seed,
  best,
  onGameOver,
  onQuit,
}: {
  engine: Engine;
  mode: GameMode;
  seed: number;
  best: number;
  onGameOver: (state: GameState) => void;
  onQuit: () => void;
}) {
  const { state, dispatch, now } = useGame(engine, mode, seed);
  const rootRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => fx.screenIn(rootRef.current), []);
  const { round, phase } = state;
  const identity = round ? engine.identity(round.identityId) : undefined;
  const preview = mode === 'preview';
  usePreload(state.upcoming?.id);

  // Somente em `npm run dev`: permite que scripts de captura acertem rodadas. Removido do build de produção.
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __iconesAnswer?: string }).__iconesAnswer = identity?.names[0];
  }, [identity]);

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

  const progress = multiplierProgress(state.combo, cfg.scoring);
  const heat = heatLevel(progress.current);
  const remaining = phase === 'playing' || phase === 'paused' ? roundRemainingMs(state, now) : 0;
  const warning = phase === 'playing' && remaining > 0 && remaining <= cfg.timer.warningSeconds * 1000;

  useGameAudio(state, { seed, best, warning });

  // Clima global da tela: "calor" do combo e tensão do fim do tempo (lidos pelo CSS do fundo).
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.heat = String(heat);
    return () => {
      delete root.dataset.heat;
    };
  }, [heat]);
  useEffect(() => {
    const root = document.documentElement;
    if (warning) root.dataset.danger = 'true';
    else delete root.dataset.danger;
    return () => {
      delete root.dataset.danger;
    };
  }, [warning]);

  if (phase === 'unavailable' || !round || !identity) {
    return (
      <section className="screen center-screen" data-testid="unavailable-screen">
        <div className="panel locked-panel">
          <h2>Banco de imagens em preparação</h2>
          <p>Não há ícones com imagem disponível para continuar esta partida.</p>
          <button className="btn btn--primary" onClick={onQuit}>
            <HomeIcon /> Voltar ao início
          </button>
        </div>
      </section>
    );
  }

  const recovery = recoveryView(state, cfg);
  const hints = hintRechargeView(state, cfg);
  const resolution = phase === 'feedback' || phase === 'gameover' ? state.lastResolution : null;
  const resolvedHere = resolution && resolution.roundId === round.id ? resolution : null;
  const brokenNow = state.streakBreak?.roundId === round.id;
  const canAct = phase === 'playing';
  const person = identity.kind === 'person';

  return (
    <section className="screen game-screen" ref={rootRef} data-phase={phase} data-testid="game-screen">
      <header className="topbar" data-enter>
        <Hearts lives={state.lives.lives} max={cfg.lives.max} />
        <Score value={state.score} best={best} competitive={!preview} />
        <Multiplier progress={progress} combo={state.combo} />
        <RecoveryStrip {...recovery} brokenNow={brokenNow} gainedNow={Boolean(resolvedHere?.lifeGained)} />
      </header>

      <div className="statusbar" data-enter>
        <RoundBadge number={round.number} />
        <StreakChip combo={state.combo} />
        <span className="statusbar-spacer" />
        <MuteButton />
        <button className="icon-btn" onClick={() => dispatch({ type: 'hide' })} disabled={!canAct} aria-label="Pausar">
          <PauseIcon />
        </button>
      </div>

      <div className="stage">
        <RoundCard
          key={round.id}
          identity={identity}
          preview={preview}
          resolution={resolvedHere}
          onImageFailed={onImageFailed}
          onImageShown={onImageShown}
          hidden={phase === 'paused'}
        >
          {phase === 'playing' && (
            <>
              <TimeFuse remainingMs={remaining} durationMs={round.timer.durationMs} warning={warning} />
              <TimerRing remainingMs={remaining} durationMs={round.timer.durationMs} warningSeconds={cfg.timer.warningSeconds} />
            </>
          )}
          {resolvedHere && <FeedbackOverlay resolution={resolvedHere} name={engine.identity(resolvedHere.identityId)?.displayName ?? ''} />}
        </RoundCard>
        {resolvedHere && <Celebration resolution={resolvedHere} />}
      </div>

      <footer className="controls">
        <p className="prompt" id="prompt">
          {person ? <CameraIcon /> : <MaskIcon />}
          {person ? 'Quem é esta pessoa?' : 'Quem é este personagem?'}
        </p>

        {round.options ? (
          <OptionsPanel
            key={`opts-${round.id}`}
            options={round.options.map((id) => engine.identity(id)).filter((o): o is Identity => Boolean(o))}
            correctId={round.identityId}
            resolution={resolvedHere}
            disabled={!canAct}
            onPick={(optionId) => dispatch({ type: 'pickOption', roundId: round.id, optionId })}
          />
        ) : (
          <AnswerForm
            roundId={round.id}
            disabled={!canAct}
            suggest={engine.answers.suggest}
            onSubmit={(guess) => dispatch({ type: 'submit', roundId: round.id, guess })}
          />
        )}

        {phase === 'feedback' ? (
          <NextButton
            key={`next-${round.id}`}
            delayMs={resolvedHere?.outcome === 'correct' || resolvedHere?.outcome === 'correct-hint' ? cfg.feedback.correctDelayMs : cfg.feedback.wrongDelayMs}
            onNext={() => dispatch({ type: 'next', roundId: round.id })}
          />
        ) : (
          <div className="aids">
            <button
              className="btn btn--aid"
              disabled={!canAct || state.skipsLeft <= 0}
              onClick={() => dispatch({ type: 'skip', roundId: round.id })}
              aria-label={`Pular, ${state.skipsLeft} restantes`}
            >
              <AidIcon tone="skip" left={state.skipsLeft}>
                <SkipIcon />
              </AidIcon>
              <span className="aid-label">Pular</span>
            </button>
            <button
              className="btn btn--aid btn--hint"
              disabled={!canAct || state.hintsLeft <= 0 || round.options !== null}
              onClick={() => dispatch({ type: 'useHint', roundId: round.id })}
              aria-label={
                state.hintsLeft > 0
                  ? `Mostrar 3 alternativas: ${hints.charges} de ${hints.max} cargas${hints.full ? '' : `, +1 carga em ${hints.remaining} acertos`}`
                  : `Alternativas esgotadas: próxima carga em ${hints.remaining} acertos`
              }
              data-testid="hint-button"
            >
              <span className="aid-icon hint" aria-hidden="true">
                <OptionsIcon />
              </span>
              <span className="aid-stack">
                <span className="aid-label">Alternativas</span>
                <HintCharges {...hints} />
              </span>
            </button>
          </div>
        )}
        <EnterToAdvance active={phase === 'feedback'} onNext={() => dispatch({ type: 'next', roundId: round.id })} />
      </footer>

      {phase === 'paused' && <PauseSheet state={state} onResume={() => dispatch({ type: 'resume' })} onQuit={onQuit} />}
    </section>
  );
}

/** Ícone da ajuda com o contador de usos restantes em selo. */
function AidIcon({ tone, left, children }: { tone: 'skip' | 'hint'; left: number; children: ReactNode }) {
  return (
    <span className={`aid-icon ${tone}`} aria-hidden="true">
      {children}
      <span className={`aid-count${left === 0 ? ' is-empty' : ''}`}>{left}</span>
    </span>
  );
}

function RoundCard({
  identity,
  preview,
  hidden,
  resolution,
  onImageFailed,
  onImageShown,
  children,
}: {
  identity: Identity;
  preview: boolean;
  hidden: boolean;
  resolution: Resolution | null;
  onImageFailed: () => void;
  onImageShown: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => fx.cardIn(ref.current), []);

  const outcome = resolution?.outcome;
  useEffect(() => {
    const el = ref.current;
    if (!outcome || !el || !resolution) return;
    if (outcome === 'correct') {
      const fast = isFastAnswer(resolution.score, cfg.scoring);
      particlesFx.burst(el, fast ? PALETTES.gold : PALETTES.good, fast ? 40 : 28, fast ? 1.25 : 1);
      fx.pop(el, 1.04);
      fx.floatText(document.querySelector('.score-value'), `+${resolution.score.total.toLocaleString('pt-BR')}`, 'float-gold');
      haptic(18);
    } else if (outcome === 'correct-hint') {
      particlesFx.burst(el, PALETTES.cyan, 16, 0.7);
      fx.floatText(document.querySelector('.score-value'), `+${resolution.score.total}`, 'float-cyan');
    } else if (outcome === 'wrong' || outcome === 'timeout') {
      fx.shake(el, 16);
    } else if (outcome === 'skipped') {
      fx.cardSkip(el);
    }
  }, [outcome, resolution]);

  const state = outcome === 'correct' || outcome === 'correct-hint' ? 'good' : outcome === 'skipped' ? 'neutral' : outcome ? 'bad' : 'live';
  return (
    <div className="card-frame" ref={ref} data-result={state} data-testid="challenge-card">
      <div className="card">
        {hidden ? <div className="image-hidden" aria-hidden="true" /> : <ChallengeImage identity={identity} preview={preview} onFailed={onImageFailed} onShown={onImageShown} />}
        {preview && (
          <span className="card-ribbon" title="Partida de treino: não conta recorde">
            Treino
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

function AnswerForm({
  roundId,
  disabled,
  suggest,
  onSubmit,
}: {
  roundId: number;
  disabled: boolean;
  suggest: (guess: string) => string | null;
  onSubmit: (guess: string) => void;
}) {
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

  // Corretor: só aparece quando o texto já é quase um nome do catálogo (nunca a partir da resposta da rodada).
  const suggestion = useMemo(() => (disabled ? null : suggest(value)), [disabled, suggest, value]);
  const applySuggestion = () => {
    if (!suggestion) return;
    setValue(suggestion);
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <form className="answer" onSubmit={submit} autoComplete="off">
      {suggestion && (
        <button
          type="button"
          className="suggest-chip"
          data-testid="suggestion"
          // Não tira o foco do campo (o teclado do celular continua aberto).
          onPointerDown={(e) => e.preventDefault()}
          onClick={applySuggestion}
          aria-label={`Corrigir para ${suggestion}`}
        >
          <SpellIcon />
          <span className="suggest-text">
            Você quis dizer: <b>{suggestion}</b>?
          </span>
          <kbd>Tab</kbd>
        </button>
      )}
      <div className="answer-field">
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
          onKeyDown={(e) => {
            if (e.key === 'Tab' && !e.shiftKey && suggestion) {
              e.preventDefault();
              applySuggestion();
            }
          }}
          data-testid="answer-input"
        />
      </div>
      <button className="btn btn--primary answer-submit" type="submit" disabled={disabled || !value.trim()} aria-label="Responder">
        <span className="answer-submit-label">Responder</span>
        <PlayIcon className="answer-submit-icon" />
      </button>
    </form>
  );
}

function OptionsPanel({
  options,
  correctId,
  resolution,
  disabled,
  onPick,
}: {
  options: Identity[];
  correctId: string;
  resolution: Resolution | null;
  disabled: boolean;
  onPick: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    fx.cascade(ref.current?.children);
    ref.current?.querySelector('button')?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const opt = options[Number(e.key) - 1];
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
      {options.map((o, i) => {
        // Só depois de resolvida a rodada as opções revelam certo/errado.
        const reveal = resolution !== null;
        const cls = reveal ? (o.id === correctId ? ' is-correct' : o.displayName === resolution?.guess ? ' is-wrong' : ' is-dim') : '';
        return (
          <button key={o.id} className={`btn btn--option${cls}`} disabled={disabled} onClick={() => onPick(o.id)}>
            <kbd>{i + 1}</kbd>
            <span>{o.displayName}</span>
          </button>
        );
      })}
    </div>
  );
}

function FeedbackOverlay({ resolution, name }: { resolution: Resolution; name: string }) {
  const titleRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    fx.stamp(titleRef.current);
    fx.slideUp(bodyRef.current, 0.12);
  }, []);
  const { outcome, score } = resolution;
  const good = outcome === 'correct' || outcome === 'correct-hint';
  const fast = outcome === 'correct' && isFastAnswer(score, cfg.scoring);
  const title =
    outcome === 'correct' ? (fast ? 'Relâmpago!' : 'Acertou!') : outcome === 'correct-hint' ? 'Com ajuda!' : outcome === 'timeout' ? 'Tempo!' : outcome === 'skipped' ? 'Pulou' : 'Errou!';
  const tone = good ? 'good' : outcome === 'skipped' ? 'neutral' : 'bad';
  return (
    <div className={`feedback is-${tone}`} role="status" data-testid="feedback">
      <strong className="feedback-title" ref={titleRef}>
        {outcome === 'timeout' && <ClockIcon />}
        {fast && <BoltIcon />}
        {title}
      </strong>
      <div className="feedback-body" ref={bodyRef}>
        <span className="feedback-name">{good ? name : `Era ${name}`}</span>
        <span className="feedback-meta">
          {score.total > 0 && <span className="tag tag--points">+{score.total.toLocaleString('pt-BR')}</span>}
          {score.aidedShare !== undefined && <span className="tag tag--hint">½ com ajuda</span>}
          {resolution.match === 'typo' && <span className="tag tag--spell">grafia corrigida</span>}
          {score.multiplier > 1 && <span className="tag tag--mult">x{score.multiplier}</span>}
          {fast && <span className="tag tag--fast">rápido +{score.speedBonus}</span>}
          {resolution.lifeLost && <span className="tag tag--bad">−1 vida</span>}
          {resolution.lifeGained && <span className="tag tag--good">+1 vida</span>}
          {outcome === 'skipped' && <span className="tag">vida mantida</span>}
        </span>
      </div>
    </div>
  );
}

/** Momento especial no centro do palco: subiu de multiplicador ou recuperou vida. */
function Celebration({ resolution }: { resolution: Resolution }) {
  const ref = useRef<HTMLDivElement>(null);
  const multUp =
    resolution.outcome === 'correct' && resolution.comboAfter > 1 && multiplierFor(resolution.comboAfter, cfg.scoring) > multiplierFor(resolution.comboAfter - 1, cfg.scoring);
  const show = resolution.lifeGained || multUp;
  useLayoutEffect(() => {
    if (!show) return;
    fx.stamp(ref.current);
    particlesFx.burst(ref.current, resolution.lifeGained ? PALETTES.good : PALETTES.gold, 34, 1.3);
  }, [show, resolution.lifeGained]);
  if (!show) return null;
  return (
    <div className={`celebration ${resolution.lifeGained ? 'is-life' : 'is-combo'}`} ref={ref} aria-hidden="true">
      {resolution.lifeGained ? (
        <>
          <HeartIcon filled />
          <b>+1 VIDA!</b>
          <small>recuperada por sequência de acertos</small>
        </>
      ) : (
        <>
          <SparkIcon />
          <b>Combo x{multiplierFor(resolution.comboAfter, cfg.scoring)}!</b>
        </>
      )}
    </div>
  );
}

function NextButton({ delayMs, onNext }: { delayMs: number; onNext: () => void }) {
  return (
    <button className="btn btn--next" onClick={onNext} data-testid="next" style={{ ['--auto-ms' as string]: `${delayMs}ms` }}>
      <span className="next-progress" aria-hidden="true" />
      <span className="next-label">
        Próximo <kbd>Enter</kbd>
      </span>
    </button>
  );
}

function PauseSheet({ state, onResume, onQuit }: { state: GameState; onResume: () => void; onQuit: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => fx.cascade(ref.current?.querySelectorAll('[data-pop]')), []);
  return (
    <div className="sheet-backdrop">
      <div className="sheet pause-sheet" ref={ref} role="dialog" aria-modal="true" aria-labelledby="pause-title">
        <div className="pause-emblem" data-pop>
          <PauseIcon />
        </div>
        <h2 id="pause-title" data-pop>
          Pausado
        </h2>
        <dl className="mini-stats" data-pop>
          <div>
            <dt>Pontos</dt>
            <dd>{state.score.toLocaleString('pt-BR')}</dd>
          </div>
          <div>
            <dt>Rodada</dt>
            <dd>{state.round?.number ?? 0}</dd>
          </div>
          <div>
            <dt>Vidas</dt>
            <dd>{state.lives.lives}</dd>
          </div>
        </dl>
        <div className="sheet-sound" data-pop>
          <SoundControls compact />
        </div>
        <p className="sheet-note" data-pop>
          Ao continuar, um <b>novo ícone</b> é sorteado e você <b>não perde vida</b>. O combo e a sequência para recuperar vida recomeçam.
        </p>
        <div className="sheet-actions" data-pop>
          <button className="btn btn--primary btn--lg" autoFocus onClick={onResume}>
            <PlayIcon /> Continuar
          </button>
          <button className="btn btn--ghost" onClick={onQuit}>
            <HomeIcon /> Sair da partida
          </button>
        </div>
      </div>
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
