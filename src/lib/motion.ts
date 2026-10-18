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

/** Coreografias curtas da interface. Com movimento reduzido, aplicam o estado final instantaneamente. */
export const fx = {
  cardIn(el: Element | null) {
    if (!el) return;
    if (isReduced()) return void gsap.set(el, { opacity: 1, scale: 1, y: 0 });
    gsap.fromTo(el, { opacity: 0, scale: 0.965, y: 14 }, { opacity: 1, scale: 1, y: 0, duration: 0.42, ease: 'power3.out' });
  },
  pop(el: Element | null, strength = 1.18) {
    if (!el || isReduced()) return;
    gsap.fromTo(el, { scale: strength }, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
  },
  shake(el: Element | null) {
    if (!el || isReduced()) return;
    gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.3)' });
  },
  countTo(el: HTMLElement | null, from: number, to: number) {
    if (!el) return;
    if (isReduced() || from === to) {
      el.textContent = to.toLocaleString('pt-BR');
      return;
    }
    const obj = { v: from };
    gsap.to(obj, {
      v: to,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.v).toLocaleString('pt-BR');
      },
    });
  },
  slideUp(el: Element | null) {
    if (!el) return;
    if (isReduced()) return void gsap.set(el, { opacity: 1, y: 0 });
    gsap.fromTo(el, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
  },
};
