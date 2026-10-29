import { motion, useReducedMotion } from 'framer-motion';
import { useId } from 'react';
import { ATTENDANCE_TARGET } from '../config/env.js';
import { EASE_OUT } from '../utils/motion.js';
import { statusMeta } from '../utils/status.js';

/** Circular progress that draws itself, with a tick at the target. */
export default function ProgressRing({
  value,
  status,
  size = 220,
  stroke = 16,
  target = ATTENDANCE_TARGET,
  showTarget = true,
  glow = true,
  delay = 0.1,
  children,
  label,
}) {
  const id = useId();
  const reduce = useReducedMotion();
  const meta = statusMeta(status);
  const r = (size - stroke) / 2;
  const c = size / 2;
  const fraction = Math.max(0, Math.min(100, value || 0)) / 100;
  const angle = (target / 100) * 2 * Math.PI;
  const tick = {
    x1: c + (r - stroke * 0.85) * Math.sin(angle),
    y1: c - (r - stroke * 0.85) * Math.cos(angle),
    x2: c + (r + stroke * 0.85) * Math.sin(angle),
    y2: c - (r + stroke * 0.85) * Math.cos(angle),
  };

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${(value ?? 0).toFixed(2)} percent attendance, ${meta.label}`}
    >
      {glow && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-[12%] rounded-full blur-2xl"
          animate={{ backgroundColor: `${meta.hex}33` }}
          transition={{ duration: 0.8 }}
        />
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <motion.stop offset="0" animate={{ stopColor: meta.hex }} transition={{ duration: 0.8 }} />
            <motion.stop offset="1" animate={{ stopColor: meta.hex2 }} transition={{ duration: 0.8 }} />
          </linearGradient>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" className="text-line/10" strokeWidth={stroke} />
        <motion.circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${id}-g)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: fraction }}
          transition={{ duration: reduce ? 0 : 1.5, ease: EASE_OUT, delay }}
        />
        {showTarget && (
          <line {...tick} stroke="currentColor" className="text-fg/70" strokeWidth={2.5} strokeLinecap="round" />
        )}
      </svg>
      <div className="relative z-10 flex flex-col items-center text-center">{children}</div>
    </div>
  );
}
