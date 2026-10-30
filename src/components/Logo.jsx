import { motion } from 'framer-motion';
import { useId } from 'react';

/** Safe75 mark: a ring three-quarters full. */
export function LogoMark({ size = 36, animate = true }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00ff66" />
          <stop offset=".55" stopColor="#00e05a" />
          <stop offset="1" stopColor="#96ffbe" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#${id})`} opacity=".16" />
      <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeOpacity=".14" strokeWidth="5" />
      <motion.circle
        cx="20"
        cy="20"
        r="12"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="5"
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 0.75 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      />
    </svg>
  );
}

export default function Logo({ size = 36, showText = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className="text-lg font-extrabold tracking-tight">
          Safe<span className="text-gradient">75</span>
        </span>
      )}
    </span>
  );
}
