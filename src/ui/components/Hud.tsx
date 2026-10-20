import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { HintRechargeView } from '../../domain/engine';
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

/**
 * Barra "Recuperar vida": acertos SEGUIDOS SEM AJUDA rumo à próxima vida (metas 3, 5, 7, 10, 15…).
 * Mensagens derivadas do estado canônico do motor (sem estado próprio): quebra da sequência na rodada
 * atual (`brokenNow`) e vida recuperada (`gainedNow`). Animações por acerto ficam em efeitos.
 */
export function RecoveryStrip({
  required,
  progress,
  paused,
  brokenNow,
  gainedNow,
}: {
  required: number;
  progress: number;
  paused: boolean;
  brokenNow: boolean;
  gainedNow: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef(progress);
  useEffect(() => {
    const el = ref.current;
    if (el && progress > prev.current && !paused) {
      // O segmento recém-aceso "acende" e o número pula; perto da meta, a faixa pulsa mais forte.
      const seg = el.querySelector(`[data-seg="${progress - 1}"]`);
      fx.pop(seg, 1.9);
      fx.pop(el.querySelector('.rs-count b'), 1.5);
      if (required - progress <= 1) fx.glowPulse(el);
      haptic(10);
    }
    prev.current = progress;
  }, [progress, paused, required]);
  useEffect(() => {
    if (!gainedNow) return;
    const el = ref.current;
    particlesFx.burst(el, PALETTES.good, 30, 1.1);
    fx.glowPulse(el);
  }, [gainedNow]);
  useEffect(() => {
    if (brokenNow) fx.shake(ref.current, 8);
  }, [brokenNow]);

  const left = required - progress;
  const state = gainedNow ? 'is-gained' : brokenNow ? 'is-broken' : paused ? 'is-paused' : left === 1 ? 'is-close' : '';
  const caption = gainedNow
    ? '+1 VIDA — recuperada por sequência de acertos!'
    : brokenNow
      ? 'Sequência interrompida — comece de novo'
      : paused
        ? 'recuperação pausada'
        : left === 1
          ? 'falta 1 acerto seguido!'
          : `faltam ${left} acertos seguidos`;
  const label = paused && !gainedNow ? 'Vidas completas' : 'Recuperar vida';
  return (
    <div
      ref={ref}
      className={`recovery-strip ${state}`}
      data-testid="recovery"
      role="status"
      aria-live="polite"
      aria-label={paused && !gainedNow ? 'Vidas completas: recuperação pausada' : `Recuperar vida: ${progress} de ${required} acertos seguidos. ${caption}`}
    >
      <span className="rs-head">
        {paused && !gainedNow ? <ShieldHeart className="rs-icon is-shield" /> : <HeartIcon filled className="rs-icon" />}
        <span className="rs-label">{label}</span>
        <span className="rs-caption">{caption}</span>
      </span>
      <span className="rs-bar">
        <span className="rs-track" aria-hidden="true" style={{ ['--segs' as string]: required }}>
          {Array.from({ length: required }, (_, i) => (
            <span key={`${required}-${i}`} data-seg={i} className={gainedNow || (!paused && i < progress) ? 'rs-seg is-on' : !paused && i === progress ? 'rs-seg is-next' : 'rs-seg'} />
          ))}
        </span>
        <span className="rs-count" aria-hidden="true">
          {gainedNow ? <b>+1</b> : paused ? <b>✓</b> : (
            <>
              <b>{progress}</b>/{required}
            </>
          )}
        </span>
      </span>
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

/**
 * Cargas da ajuda "3 alternativas" (cristais) + recarga por acertos ACUMULADOS (linha na base do botão).
 * Visual distinto da barra de vida: cristais violeta, nada de corações nem de "seguidos".
 */
export function HintCharges({ charges, max, progress, every, full, remaining }: HintRechargeView) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(charges);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (charges < prev.current) {
      // Carga gasta: o cristal "descarrega" (brilho rápido e apaga).
      const pip = el.querySelector(`[data-pip="${charges}"]`);
      if (pip && !isReduced()) gsap.fromTo(pip, { scale: 1.8, filter: 'brightness(2.4)' }, { scale: 1, filter: 'brightness(1)', duration: 0.5, ease: 'power2.out', clearProps: 'filter' });
      particlesFx.burst(pip, PALETTES.cyan, 10, 0.45);
    }
    if (charges > prev.current) {
      // Recarga: o cristal volta com bounce, faíscas e o selo "+1 alternativa".
      const pip = el.querySelector(`[data-pip="${charges - 1}"]`);
      if (pip && !isReduced()) gsap.fromTo(pip, { scale: 0.2, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.8, ease: 'elastic.out(1.1, 0.4)' });
      particlesFx.burst(el, PALETTES.cyan, 26, 0.9);
      fx.floatText(el, '+1 alternativa', 'float-cyan');
      haptic(22);
    }
    prev.current = charges;
  }, [charges]);
  return (
    <span className={`hint-charges${full ? ' is-full' : ''}${charges === 0 ? ' is-empty' : ''}`} ref={ref} aria-hidden="true">
      <span className="hc-row">
        <span className="hc-pips">
          {Array.from({ length: max }, (_, i) => (
            <span key={i} data-pip={i} className={i < charges ? 'hc-pip is-on' : 'hc-pip'} />
          ))}
        </span>
        <span className="hc-caption">{full ? `${charges}/${max}` : `+1 em ${remaining}`}</span>
      </span>
      <span className="hc-recharge" style={{ ['--p' as string]: full ? 0 : progress / every }} />
    </span>
  );
}
