import { gsap } from 'gsap';
import type { MotionPreference } from './storage';

/** Movimento reduzido efetivo: preferência explícita do jogador ou, em "system", a do sistema operacional. */
export function resolveReducedMotion(pref: MotionPreference): boolean {
  if (pref === 'reduced') return true;
  if (pref === 'full') return false;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function applyMotionPreference(reduced: boolean): void {
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
}

export function isReduced(): boolean {
  return document.documentElement.dataset.motion === 'reduced';
}

/** Vibração curta em celulares compatíveis (silenciosamente ignorada no resto). */
export function haptic(pattern: number | number[]): void {
  if (isReduced()) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // sem suporte
  }
}

type El = Element | null | undefined;

/**
 * Coreografias da interface. Todas são curtas (< 0,8 s) e, com movimento reduzido,
 * aplicam o estado final instantaneamente — nenhuma informação depende da animação.
 */
export const fx = {
  /** Entrada de tela: filhos marcados com [data-enter] sobem em cascata. */
  screenIn(root: El) {
    if (!root) return;
    const items = root.querySelectorAll('[data-enter]');
    if (isReduced() || items.length === 0) return void gsap.set(items, { opacity: 1, y: 0, scale: 1 });
    gsap.fromTo(items, { opacity: 0, y: 26, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out', stagger: 0.06, clearProps: 'transform' });
  },
  /** Entrada do cartão da rodada: leve giro 3D + escala, com "assentamento". */
  cardIn(el: El) {
    if (!el) return;
    if (isReduced()) return void gsap.set(el, { opacity: 1, scale: 1, rotationY: 0, y: 0 });
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.86, rotationY: -18, y: 18, transformPerspective: 900 },
      { opacity: 1, scale: 1, rotationY: 0, y: 0, duration: 0.6, ease: 'back.out(1.6)', clearProps: 'transform' },
    );
  },
  /** Saída do cartão ao pular. */
  cardSkip(el: El) {
    if (!el || isReduced()) return;
    gsap.to(el, { x: 40, rotation: 6, opacity: 0.55, duration: 0.35, ease: 'power2.in' });
  },
  pop(el: El, strength = 1.18) {
    if (!el || isReduced()) return;
    gsap.fromTo(el, { scale: strength }, { scale: 1, duration: 0.5, ease: 'back.out(3)', clearProps: 'transform' });
  },
  shake(el: El, intensity = 10) {
    if (!el || isReduced()) return;
    gsap.fromTo(el, { x: -intensity }, { x: 0, duration: 0.6, ease: 'elastic.out(1.4, 0.25)', clearProps: 'transform' });
  },
  /** Carimbo: entra grande e gira até assentar (títulos de acerto/erro). */
  stamp(el: El) {
    if (!el) return;
    if (isReduced()) return void gsap.set(el, { opacity: 1, scale: 1, rotation: 0 });
    gsap.fromTo(el, { opacity: 0, scale: 2.1, rotation: -10 }, { opacity: 1, scale: 1, rotation: -2, duration: 0.45, ease: 'back.out(2.2)' });
  },
  slideUp(el: El, delay = 0) {
    if (!el) return;
    if (isReduced()) return void gsap.set(el, { opacity: 1, y: 0 });
    gsap.fromTo(el, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.38, delay, ease: 'power3.out', clearProps: 'transform' });
  },
  /** Itens surgindo em cascata (alternativas, estatísticas). */
  cascade(els: ArrayLike<Element> | null | undefined, delay = 0) {
    if (!els || els.length === 0) return;
    if (isReduced()) return void gsap.set(els, { opacity: 1, y: 0, scale: 1 });
    gsap.fromTo(els, { opacity: 0, y: 18, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, delay, stagger: 0.07, ease: 'back.out(1.8)', clearProps: 'transform' });
  },
  countTo(el: HTMLElement | null, from: number, to: number, duration = 0.6) {
    if (!el) return;
    if (isReduced() || from === to) {
      el.textContent = to.toLocaleString('pt-BR');
      return;
    }
    const obj = { v: from };
    gsap.to(obj, {
      v: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.v).toLocaleString('pt-BR');
      },
    });
  },
  /** Texto flutuante (ex.: "+150") que sobe a partir de um elemento e some. */
  floatText(anchor: El, text: string, className: string) {
    if (!anchor || isReduced()) return;
    const r = anchor.getBoundingClientRect();
    const node = document.createElement('div');
    node.className = `float-text ${className}`;
    node.textContent = text;
    node.setAttribute('aria-hidden', 'true');
    node.style.left = `${r.left + r.width / 2}px`;
    node.style.top = `${r.top + r.height / 2}px`;
    document.body.appendChild(node);
    gsap.fromTo(
      node,
      { xPercent: -50, yPercent: -50, y: 10, scale: 0.6, opacity: 0 },
      {
        keyframes: [
          { y: -18, scale: 1.15, opacity: 1, duration: 0.25, ease: 'back.out(3)' },
          { y: -70, scale: 1, opacity: 0, duration: 0.7, delay: 0.25, ease: 'power2.in' },
        ],
        onComplete: () => node.remove(),
      },
    );
  },
  /** Pulso de destaque (milestones de combo, vida recuperada). */
  glowPulse(el: El) {
    if (!el || isReduced()) return;
    gsap.fromTo(el, { filter: 'brightness(1.9) saturate(1.4)' }, { filter: 'brightness(1) saturate(1)', duration: 0.8, ease: 'power2.out', clearProps: 'filter' });
  },
};
