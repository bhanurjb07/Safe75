import { KEYS, session } from './storage.js';

/** Confetti burst, at most once per session. Skipped for reduced-motion users. */
export async function celebrateOnce() {
  if (session.get(KEYS.confetti, false)) return;
  session.set(KEYS.confetti, true);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { default: confetti } = await import('canvas-confetti');
  const colors = ['#00ff66', '#00e05a', '#96ffbe', '#00b84d', '#c8ffdc'];
  const base = { particleCount: 70, spread: 70, startVelocity: 42, ticks: 220, colors, disableForReducedMotion: true, zIndex: 80 };
  confetti({ ...base, angle: 60, origin: { x: 0, y: 0.7 } });
  setTimeout(() => confetti({ ...base, angle: 120, origin: { x: 1, y: 0.7 } }), 180);
}
