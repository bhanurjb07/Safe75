import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { tapOnly } from '../utils/motion.js';

/** − value + control. Big variant shows the number in a box above the buttons. */
export default function Stepper({ value, min = 0, max = 99, onChange, label, size = 'md' }) {
  const btn =
    'grid place-items-center rounded-xl bg-line/[0.07] text-muted transition-colors hover:bg-line/[0.12] hover:text-fg disabled:opacity-30 ' +
    (size === 'lg' ? 'h-9 w-10' : 'h-8 w-8');
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={label}>
      <motion.button {...tapOnly} type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Decrease ${label}`} className={btn}>
        <Minus className="h-4 w-4" />
      </motion.button>
      <span className={`relative grid place-items-center overflow-hidden rounded-xl bg-line/[0.05] font-bold tabular ${size === 'lg' ? 'h-9 w-12 text-lg' : 'h-8 w-9'}`}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.15 }}>
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <motion.button {...tapOnly} type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Increase ${label}`} className={btn}>
        <Plus className="h-4 w-4" />
      </motion.button>
    </div>
  );
}
