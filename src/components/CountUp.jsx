import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { EASE_OUT } from '../utils/motion.js';

/** Number that counts up to `value`. Screen readers get the final value only. */
export default function CountUp({ value, decimals = 0, suffix = '', duration = 1.3, delay = 0, className = '' }) {
  const reduce = useReducedMotion();
  const safe = Number.isFinite(value) ? value : 0;
  const mv = useMotionValue(reduce ? safe : 0);
  const text = useTransform(mv, (v) => `${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    if (reduce) {
      mv.set(safe);
      return undefined;
    }
    const controls = animate(mv, safe, { duration, delay, ease: EASE_OUT });
    return () => controls.stop();
  }, [safe, reduce, duration, delay, mv]);

  return (
    <span className={`tabular ${className}`}>
      <motion.span aria-hidden="true">{text}</motion.span>
      <span className="sr-only">{`${safe.toFixed(decimals)}${suffix}`}</span>
    </span>
  );
}
