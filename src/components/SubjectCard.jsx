import { motion } from 'framer-motion';
import { CalendarCheck2, CalendarX2, CheckCircle2, TriangleAlert } from 'lucide-react';
import { forwardRef } from 'react';
import { ATTENDANCE_TARGET } from '../config/env.js';
import { EASE_OUT, fadeUp, spring } from '../utils/motion.js';
import { cn, plural, statusMeta } from '../utils/status.js';
import BigPercent from './BigPercent.jsx';
import { TypeBadge } from './StatusBadge.jsx';

/** Gradient bar with a marker at the target. */
export function AttendanceBar({ value, status, delay = 0.2, className = 'h-2' }) {
  const meta = statusMeta(status);
  return (
    <div className={cn('relative overflow-hidden rounded-full bg-line/10', className)} aria-hidden="true">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundImage: `linear-gradient(90deg, ${meta.hex}, ${meta.hex2})` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 1.1, ease: EASE_OUT, delay }}
      />
      <div className="absolute inset-y-0 w-0.5 bg-fg/60" style={{ left: `${ATTENDANCE_TARGET}%` }} />
    </div>
  );
}

/** Outlined badge: "Need 17" (below target) or "Skip 3" (above). Icon + text, never colour alone. */
export function NeedBadge({ subject, className = '' }) {
  const need = subject.mustAttend > 0;
  const Icon = need ? TriangleAlert : CheckCircle2;
  const text = need
    ? `Need ${Number.isFinite(subject.mustAttend) ? subject.mustAttend : 'all'}`
    : subject.canSkip > 0
      ? `Skip ${subject.canSkip}`
      : 'No skips';
  const tone = need ? 'border-danger/40 bg-danger/10 text-danger-ink' : subject.canSkip > 0 ? 'border-safe/40 bg-safe/10 text-safe-ink' : 'border-warn/40 bg-warn/10 text-warn-ink';
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm font-semibold', tone, className)}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {text}
    </span>
  );
}

export function SkipLine({ subject, className = '' }) {
  if (subject.mustAttend > 0) {
    return (
      <p className={cn('flex items-center gap-1.5 text-sm font-medium text-danger-ink', className)}>
        <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
        To reach {ATTENDANCE_TARGET}% · attend {Number.isFinite(subject.mustAttend) ? plural(subject.mustAttend, 'more class', 'more classes') : 'every class'}
      </p>
    );
  }
  return (
    <p className={cn('flex items-center gap-1.5 text-sm font-medium', subject.canSkip > 0 ? 'text-safe-ink' : 'text-warn-ink', className)}>
      <CalendarX2 className="h-4 w-4" aria-hidden="true" />
      {subject.canSkip > 0 ? `You can skip ${plural(subject.canSkip, 'class', 'classes')} and stay above ${ATTENDANCE_TARGET}%` : "You can't skip the next class"}
    </p>
  );
}

/** Full subject card for the Subjects page. Morphs into its detail sheet via layoutId. */
const SubjectCard = forwardRef(function SubjectCard({ subject, onOpen }, ref) {
  const meta = statusMeta(subject.status);
  return (
    <motion.button
      ref={ref}
      type="button"
      layout
      layoutId={`subject-${subject.id}`}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      onClick={() => onOpen(subject)}
      aria-label={`${subject.name}, ${subject.percentage.toFixed(2)} percent, ${meta.label}. Open details`}
      className="card card-pad group w-full overflow-hidden text-left"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `${meta.hex}33` }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[17px] font-bold leading-snug">{subject.name}</h3>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-subtle">
            <span className="font-mono">{subject.code || '—'}</span>
            <TypeBadge isLab={subject.isLab} />
          </div>
        </div>
        <BigPercent value={subject.percentage} className={cn('shrink-0 text-4xl', meta.text)} duration={1} />
      </div>
      <AttendanceBar value={subject.percentage} status={subject.status} className="relative mt-4 h-2.5" />
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted tabular">
          <span className="text-fg">{subject.present}</span>/{subject.total} classes
        </p>
        <NeedBadge subject={subject} />
      </div>
    </motion.button>
  );
});

export default SubjectCard;

/** Compact card for the dashboard's "by risk" list. */
export function SubjectMiniCard({ subject, onOpen }) {
  const meta = statusMeta(subject.status);
  const Icon = meta.icon;
  return (
    <motion.button
      type="button"
      variants={fadeUp}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      onClick={() => onOpen(subject)}
      className="card group flex w-full items-center gap-3 p-4 text-left"
      aria-label={`${subject.name}, ${subject.percentage.toFixed(2)} percent, ${meta.label}`}
    >
      <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', meta.soft, meta.text)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold">{subject.name}</p>
          <p className={cn('shrink-0 text-sm font-bold tabular', meta.text)}>{subject.percentage.toFixed(1)}%</p>
        </div>
        <AttendanceBar value={subject.percentage} status={subject.status} className="mt-2 h-1.5" delay={0.4} />
        <p className="mt-1.5 text-xs text-muted">
          {subject.mustAttend > 0
            ? `Attend ${Number.isFinite(subject.mustAttend) ? subject.mustAttend : 'all'} to recover`
            : subject.canSkip > 0
              ? `${subject.canSkip} skip${subject.canSkip === 1 ? '' : 's'} left`
              : 'No skips left'}{' '}
          · <span className="tabular">{subject.present}/{subject.total}</span>
        </p>
      </div>
    </motion.button>
  );
}
