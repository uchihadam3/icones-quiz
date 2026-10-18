import { useEffect, useLayoutEffect, useRef } from 'react';
import { fx } from '../../lib/motion';
import { HeartIcon } from './Icons';

export function Hearts({ lives, max }: { lives: number; max: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef(lives);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (lives < prev.current) fx.shake(el);
    if (lives > prev.current) fx.pop(el.querySelector(`[data-heart="${lives - 1}"]`), 1.5);
    prev.current = lives;
  }, [lives]);
  return (
    <div className="hearts" ref={ref} role="img" aria-label={`${lives} de ${max} vidas`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} data-heart={i} className={i < lives ? 'heart is-full' : 'heart is-empty'}>
          <HeartIcon filled={i < lives} />
        </span>
      ))}
    </div>
  );
}

export function Score({ value }: { value: number }) {
  const ref = useRef<HTMLElement>(null);
  const prev = useRef(value);
  useLayoutEffect(() => {
    fx.countTo(ref.current, prev.current, value);
    if (value > prev.current) fx.pop(ref.current, 1.12);
    prev.current = value;
  }, [value]);
  return (
    <div className="score">
      <span className="hud-label">Pontos</span>
      {/* O texto é controlado pela animação de contagem (fx.countTo), não pelo React. */}
      <strong ref={ref} className="score-value" data-testid="score" />
    </div>
  );
}

export function Multiplier({ value, combo, max }: { value: number; combo: number; max: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (value > prev.current) fx.pop(ref.current, 1.3);
    prev.current = value;
  }, [value]);
  return (
    <div
      ref={ref}
      className="multiplier"
      data-tier={value}
      data-testid="multiplier"
      aria-label={`Multiplicador x${value}, combo ${combo}`}
      style={{ ['--tier' as string]: (value - 1) / Math.max(1, max - 1) }}
    >
      <span className="mult-value">x{value}</span>
      <span className="mult-combo">combo {combo}</span>
    </div>
  );
}

export function RecoveryMeter({ required, progress, paused }: { required: number; progress: number; paused: boolean }) {
  if (paused) {
    return (
      <div className="recovery is-paused" data-testid="recovery">
        <span className="hud-label">Vidas cheias</span>
        <span className="recovery-hint">recuperação pausada</span>
      </div>
    );
  }
  return (
    <div className="recovery" data-testid="recovery" aria-label={`Próxima vida: ${progress} de ${required} acertos seguidos`}>
      <span className="hud-label">
        Próxima vida <b>{progress}/{required}</b>
      </span>
      <div className="recovery-track" aria-hidden="true">
        {Array.from({ length: required }, (_, i) => (
          <span key={i} className={i < progress ? 'seg is-on' : 'seg'} />
        ))}
      </div>
    </div>
  );
}

export function TimerRing({ remainingMs, durationMs, warningSeconds }: { remainingMs: number; durationMs: number; warningSeconds: number }) {
  const seconds = Math.ceil(remainingMs / 1000);
  const fraction = durationMs > 0 ? remainingMs / durationMs : 0;
  const r = 21;
  const c = 2 * Math.PI * r;
  const warning = seconds <= warningSeconds;
  return (
    <div className={warning ? 'timer is-warning' : 'timer'} role="timer" aria-label={`${seconds} segundos restantes`} data-testid="timer">
      <svg viewBox="0 0 50 50" aria-hidden="true">
        <circle className="timer-track" cx="25" cy="25" r={r} />
        <circle className="timer-fill" cx="25" cy="25" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - fraction)} />
      </svg>
      <span className="timer-value">{seconds}</span>
    </div>
  );
}
