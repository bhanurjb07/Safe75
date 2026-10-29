import { motion } from 'framer-motion';
import { useId } from 'react';
import { spring } from '../utils/motion.js';
import { cn } from '../utils/status.js';

/** Segmented control with a sliding pill. options: [{ value, label, icon? }] */
export default function Segmented({ options, value, onChange, label, size = 'md', className = '' }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-2xl bg-line/[0.05] p-1', className)}>
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-semibold transition-colors',
              size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
              active ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`${id}-pill`}
                transition={spring}
                className="absolute inset-0 rounded-xl bg-card shadow-glass ring-1 ring-line/10"
              />
            )}
            {Icon && <Icon className="relative h-4 w-4" aria-hidden="true" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
