import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { MultiplierProgress } from '../../domain/progress';
import { fx, haptic, isReduced } from '../../lib/motion';
import { particlesFx, PALETTES } from '../../lib/particles';
import { FlameIcon, HeartIcon, ShieldHeart } from './Icons';

export function Hearts({ lives, max }: { lives: number; max: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef(lives);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (lives < prev.current) {
      // O coração perdido "estala" e cai; o grupo treme.
      const lost = el.querySelector(`[data-heart="${lives}"]`);
      fx.shake(el, 12);
      fx.floatText(lost, '−1', 'float-bad');
      haptic([40, 40, 60]);
      if (lost && !isReduced()) gsap.fromTo(lost, { scale: 1.6, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.35)' });
    }
    if (lives > prev.current) {
      const gained = el.querySelector(`[data-heart="${lives - 1}"]`);
      fx.pop(gained, 1.9);
      particlesFx.burst(gained, PALETTES.good, 18, 0.6);
      fx.floatText(gained, '+1', 'float-good');
      haptic(30);
    }
    prev.current = lives;
  }, [lives]);
  return (
    <div className={`hearts${lives === 1 ? ' is-critical' : ''}`} ref={ref} role="img" aria-label={`${lives} de ${max} vidas`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} data-heart={i} className={i < lives ? 'heart is-full' : 'heart is-empty'}>
          <HeartIcon filled={i < lives} />
        </span>
      ))}
    </div>
  );
}

export function Score({ value, best, competitive }: { value: number; best: number; competitive: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const prev = useRef(value);
  useLayoutEffect(() => {
    fx.countTo(ref.current, prev.current, value);
    if (value > prev.current) fx.pop(ref.current, 1.22);
    prev.current = value;
  }, [value]);
  const beating = best > 0 && value > best;
  return (
    <div className={`score${beating ? ' is-record' : ''}`}>
      <span className="hud-label">Pontos</span>
      {/* O texto é controlado pela animação de contagem (fx.countTo), não pelo React. */}
      <strong ref={ref} className="score-value" data-testid="score" />
      <span className="score-best">
        {beating ? (competitive ? 'Novo recorde!' : 'Melhor treino!') : best > 0 ? `${competitive ? 'Recorde' : 'Treino'} ${best.toLocaleString('pt-BR')}` : ' '}
      </span>
    </div>
  );
}

export function Multiplier({ progress, combo }: { progress: MultiplierProgress; combo: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef(progress.current);
  const value = progress.current;
  useEffect(() => {
    if (value > prev.current) {
      fx.pop(ref.current, 1.45);
      fx.glowPulse(ref.current);
      particlesFx.burst(ref.current, PALETTES.gold, 22, 0.7);
      haptic(25);
    }
    prev.current = value;
  }, [value]);
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div
      ref={ref}
      className="multiplier"
      data-tier={value}
      data-testid="multiplier"
      aria-label={`Multiplicador x${value}, combo ${combo}${progress.next ? `, faltam ${progress.remaining} para x${progress.next}` : ', máximo'}`}
    >
      <svg className="mult-ring" viewBox="0 0 60 60" aria-hidden="true">
        <circle className="mult-ring-track" cx="30" cy="30" r={r} />
        <circle className="mult-ring-fill" cx="30" cy="30" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - progress.fraction)} />
      </svg>
      <span className="mult-value">
        <small>x</small>
        {value}
      </span>
      {value >= 3 && <FlameIcon className="mult-flame" />}
      <span className="mult-caption">{progress.next ? `x${progress.next} em ${progress.remaining}` : 'MÁXIMO'}</span>
    </div>
  );
}

export function RoundBadge({ number }: { number: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => fx.pop(ref.current, 1.35), [number]);
  return (
    <div className="round-badge" data-testid="round" aria-label={`Rodada ${number}`}>
      <span className="round-label" aria-hidden="true">
        Rodada
      </span>
      <span className="round-number" ref={ref} aria-hidden="true">
        {number}
      </span>
      <span className="sr-only">Rodada {number}</span>
    </div>
  );
}

export function StreakChip({ combo }: { combo: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (combo > 0) fx.pop(ref.current, 1.25);
  }, [combo]);
  return (
    <div ref={ref} className={`streak${combo >= 3 ? ' is-hot' : ''}${combo === 0 ? ' is-cold' : ''}`} data-testid="streak" aria-label={`${combo} acertos seguidos`}>
      <FlameIcon className="streak-flame" />
      <b>{combo}</b>
      <span>seguidos</span>
    </div>
  );
}

export function RecoveryMeter({ required, progress, paused }: { required: number; progress: number; paused: boolean }) {
  if (paused) {
    return (
      <div className="recovery is-paused" data-testid="recovery">
        <ShieldHeart className="recovery-icon" />
        <div className="recovery-body">
          <span className="hud-label">Vidas cheias</span>
          <span className="recovery-hint">recuperação pausada</span>
        </div>
      </div>
    );
  }
  const left = required - progress;
  return (
    <div className="recovery" data-testid="recovery" aria-label={`Próxima vida: ${progress} de ${required} acertos seguidos`}>
      <HeartIcon filled className="recovery-icon is-pending" />
      <div className="recovery-body">
        <span className="hud-label">
          <span className="recovery-word">Próxima </span>vida <b>{progress}/{required}</b>
        </span>
        <div className="recovery-track" aria-hidden="true" style={{ ['--segs' as string]: required }}>
          {Array.from({ length: required }, (_, i) => (
            <span key={i} className={i < progress ? 'seg is-on' : i === progress ? 'seg is-next' : 'seg'} />
          ))}
        </div>
        <span className="recovery-hint">{left === 1 ? 'falta 1 acerto!' : `faltam ${left} acertos seguidos`}</span>
      </div>
    </div>
  );
}

export function TimerRing({ remainingMs, durationMs, warningSeconds }: { remainingMs: number; durationMs: number; warningSeconds: number }) {
  const seconds = Math.ceil(remainingMs / 1000);
  const fraction = durationMs > 0 ? remainingMs / durationMs : 0;
  const r = 22;
  const c = 2 * Math.PI * r;
  const warning = seconds <= warningSeconds;
  const critical = seconds <= 3;
  const valueRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (warning) fx.pop(valueRef.current, critical ? 1.6 : 1.3);
    if (critical && seconds > 0) haptic(15);
  }, [seconds, warning, critical]);
  return (
    <div className={`timer${warning ? ' is-warning' : ''}${critical ? ' is-critical' : ''}`} role="timer" aria-label={`${seconds} segundos restantes`} data-testid="timer">
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle className="timer-track" cx="26" cy="26" r={r} />
        <circle className="timer-fill" cx="26" cy="26" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - fraction)} />
      </svg>
      <span className="timer-value" ref={valueRef}>
        {seconds}
      </span>
    </div>
  );
}

/** Pavio do tempo no topo do cartão: drena da esquerda para a direita. */
export function TimeFuse({ remainingMs, durationMs, warning }: { remainingMs: number; durationMs: number; warning: boolean }) {
  const fraction = durationMs > 0 ? Math.max(0, Math.min(1, remainingMs / durationMs)) : 0;
  return (
    <div className={`fuse${warning ? ' is-warning' : ''}`} aria-hidden="true">
      <span className="fuse-fill" style={{ transform: `scaleX(${fraction})` }} />
    </div>
  );
}
