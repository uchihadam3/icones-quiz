import { isReduced } from './motion';

/**
 * Partículas leves num único <canvas> em tela cheia (pointer-events: none).
 * O loop de animação só roda enquanto existem partículas vivas; com movimento reduzido, nada é emitido.
 * Limite rígido de partículas para preservar o desempenho no celular.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  size: number;
  color: string;
  shape: 'spark' | 'confetti' | 'ring';
  rot: number;
  vr: number;
}

const MAX_PARTICLES = 260;
const particles: Particle[] = [];
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let raf = 0;
let last = 0;
let dpr = 1;

export const PALETTES = {
  gold: ['#ffe08a', '#ffd166', '#ff9f5a', '#fff3c4'],
  good: ['#7dffb5', '#3ee08f', '#c6ffe0', '#5ee7ff'],
  bad: ['#ff5d73', '#ff8a9a', '#ffb3be'],
  cyan: ['#5ee7ff', '#b4f4ff', '#9b8cff'],
  party: ['#ffd166', '#ff8a5b', '#5ee7ff', '#9b8cff', '#3ee08f', '#ff5da2'],
} as const;

export function attachParticleCanvas(el: HTMLCanvasElement | null): void {
  canvas = el;
  ctx = el?.getContext('2d') ?? null;
  resize();
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
}

if (typeof window !== 'undefined') window.addEventListener('resize', resize);

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function spawn(p: Particle) {
  if (particles.length >= MAX_PARTICLES) particles.shift();
  particles.push(p);
}

function start() {
  if (raf || !ctx) return;
  last = performance.now();
  raf = requestAnimationFrame(tick);
}

function tick(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const c = ctx;
  if (!c || !canvas) {
    raf = 0;
    return;
  }
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i] as Particle;
    p.life += dt;
    if (p.life >= p.ttl) {
      particles.splice(i, 1);
      continue;
    }
    const k = 1 - p.life / p.ttl;
    if (p.shape === 'confetti') {
      p.vy += 520 * dt;
      p.vx *= 0.985;
    } else if (p.shape === 'spark') {
      p.vy += 260 * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    c.globalAlpha = Math.min(1, k * 1.6);
    c.fillStyle = p.color;
    c.strokeStyle = p.color;
    if (p.shape === 'spark') {
      c.beginPath();
      c.arc(p.x, p.y, p.size * (0.4 + k * 0.6), 0, Math.PI * 2);
      c.fill();
    } else if (p.shape === 'confetti') {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2 + Math.abs(Math.sin(p.rot * 2)) * p.size * 0.6);
      c.restore();
    } else {
      c.lineWidth = 3 * k;
      c.beginPath();
      c.arc(p.x, p.y, p.size * (1 - k) + 4, 0, Math.PI * 2);
      c.stroke();
    }
  }
  c.globalAlpha = 1;
  raf = particles.length > 0 ? requestAnimationFrame(tick) : 0;
  if (!raf) c.clearRect(0, 0, canvas.width, canvas.height);
}

function center(el: Element | null): { x: number; y: number } {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export const particlesFx = {
  /** Explosão radial de faíscas a partir do centro de um elemento. */
  burst(el: Element | null, palette: readonly string[] = PALETTES.gold, count = 26, power = 1) {
    if (!ctx || isReduced()) return;
    const { x, y } = center(el);
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + rand(-0.2, 0.2);
      const speed = rand(180, 420) * power;
      spawn({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 80, life: 0, ttl: rand(0.5, 0.9), size: rand(2, 4.5), color: pick(palette), shape: 'spark', rot: 0, vr: 0 });
    }
    spawn({ x, y, vx: 0, vy: 0, life: 0, ttl: 0.55, size: 90 * power, color: pick(palette), shape: 'ring', rot: 0, vr: 0 });
    start();
  },
  /** Chuva de confete (recorde, celebrações). */
  confetti(count = 140) {
    if (!ctx || isReduced()) return;
    const w = window.innerWidth;
    for (let i = 0; i < count; i++) {
      spawn({
        x: rand(0, w),
        y: rand(-120, -10),
        vx: rand(-80, 80),
        vy: rand(60, 260),
        life: 0,
        ttl: rand(2.2, 3.6),
        size: rand(7, 12),
        color: pick(PALETTES.party),
        shape: 'confetti',
        rot: rand(0, Math.PI),
        vr: rand(-8, 8),
      });
    }
    start();
  },
  /** Jato lateral de confete a partir dos cantos inferiores. */
  cannons(count = 60) {
    if (!ctx || isReduced()) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < count; i++) {
      const left = i % 2 === 0;
      spawn({
        x: left ? 0 : w,
        y: h * 0.85,
        vx: (left ? 1 : -1) * rand(220, 520),
        vy: -rand(520, 900),
        life: 0,
        ttl: rand(1.8, 2.8),
        size: rand(7, 11),
        color: pick(PALETTES.party),
        shape: 'confetti',
        rot: rand(0, Math.PI),
        vr: rand(-10, 10),
      });
    }
    start();
  },
  /** Para testes e trocas de tela. */
  clear() {
    particles.length = 0;
  },
  count() {
    return particles.length;
  },
};
