import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, CalendarCheck2, CalendarX2, CheckCircle2, RotateCcw, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ATTENDANCE_TARGET } from '../config/env.js';
import { subjectsWithStats } from '../utils/analytics.js';
import { mustAttend, percentage, safeToSkip, statusFor } from '../utils/attendance.js';
import { tapOnly } from '../utils/motion.js';
import { cn, plural, statusMeta } from '../utils/status.js';
import BigPercent from './BigPercent.jsx';
import ProgressRing from './ProgressRing.jsx';
import Sheet from './Sheet.jsx';
import Stepper from './Stepper.jsx';

/** The "can skip N" / "need N" pill used on the hero and in the planner. */
export function SkipPill({ present, total, className = '' }) {
  const skip = safeToSkip(present, total);
  const need = mustAttend(present, total);
  const ok = need === 0;
  const Icon = ok ? CheckCircle2 : TriangleAlert;
  const text = ok
    ? skip > 0
      ? `Can skip ${plural(skip, 'class', 'classes')}`
      : "Can't skip any class"
    : `Need ${Number.isFinite(need) ? need : 'all'} more ${need === 1 ? 'class' : 'classes'}`;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={text}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold',
          ok ? (skip > 0 ? 'bg-safe/10 text-safe-ink' : 'bg-warn/10 text-warn-ink') : 'bg-danger/10 text-danger-ink',
          className,
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        <span className="truncate">{text}</span>
      </motion.span>
    </AnimatePresence>
  );
}

function SimRow({ icon: Icon, tone, title, hint, value, onChange, max = 200 }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', tone)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <Stepper value={value} max={max} onChange={onChange} label={title} size="lg" />
    </div>
  );
}

/**
 * "Plan attendance": simulate upcoming present / absent classes for overall or one subject,
 * plus PC: past absences converted to present (e.g. an approved correction): +1 P, +0 total.
 */
export default function PlanSheet({ open, onClose, data, initialSubject = 'overall' }) {
  const [pick, setPick] = useState(initialSubject);
  const [attend, setAttend] = useState(0);
  const [skip, setSkip] = useState(0);
  const [pc, setPc] = useState(0);
  const reset = () => {
    setAttend(0);
    setSkip(0);
    setPc(0);
  };
  const subjects = useMemo(() => subjectsWithStats(data.subjects), [data.subjects]);

  useEffect(() => {
    if (open) setPick(initialSubject);
  }, [open, initialSubject]);

  const base = pick === 'overall' ? data.overall : subjects.find((s) => s.id === pick) ?? data.overall;
  const maxPc = Math.max(0, base.total - base.present);
  const pcUsed = Math.min(pc, maxPc);
  const P = base.present + attend + pcUsed;
  const T = base.total + attend + skip;
  const pct = percentage(P, T);
  const status = statusFor(pct);
  const meta = statusMeta(status);
  const changed = attend > 0 || skip > 0 || pcUsed > 0;

  return (
    <Sheet open={open} onClose={onClose} title="Plan attendance" subtitle="See where you land before you skip or attend." size="md">
      <div className="space-y-5">
        <label className="block">
          <span className="eyebrow mb-1.5 block">Plan for</span>
          <select
            value={pick}
            onChange={(e) => {
              setPick(e.target.value);
              reset();
            }}
            className="input cursor-pointer [&>option]:bg-card"
          >
            <option value="overall">Overall (all subjects)</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.percentage.toFixed(1)}%
              </option>
            ))}
          </select>
        </label>

        <motion.div layout className={cn('relative overflow-hidden rounded-3xl border p-5 transition-colors duration-500', meta.border, meta.soft)}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight">{pick === 'overall' ? 'Overall attendance' : base.name}</p>
              <p className="mt-2 text-5xl font-extrabold tracking-tight tabular">
                {P}
                <span className="text-2xl text-muted">/{T}</span>
              </p>
              {changed && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted tabular">
                  {percentage(base.present, base.total).toFixed(2)}% <ArrowRight className="h-3 w-3" aria-hidden="true" />{' '}
                  <span className={cn('font-bold', meta.text)}>{pct.toFixed(2)}%</span>
                </p>
              )}
            </div>
            <ProgressRing value={pct} status={status} size={132} stroke={11} delay={0} glow={false}>
              <BigPercent value={pct} className={cn('text-3xl', meta.text)} duration={0.5} />
            </ProgressRing>
          </div>
          <SkipPill present={P} total={T} className="mt-4 w-full justify-center" />
        </motion.div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="eyebrow">Simulate future classes</p>
            <AnimatePresence>
              {changed && (
                <motion.button
                  {...tapOnly}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={reset}
                  className="flex items-center gap-1 text-xs font-semibold text-a2"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="divide-y divide-line/[0.07] overflow-hidden rounded-3xl border border-line/10 bg-line/[0.025]">
            <SimRow
              icon={CalendarCheck2}
              tone="bg-safe/10 text-safe-ink"
              title="Upcoming present"
              hint="Attending future classes (+1 P, +1 total)"
              value={attend}
              onChange={setAttend}
            />
            <SimRow
              icon={CalendarX2}
              tone="bg-danger/10 text-danger-ink"
              title="Upcoming absent"
              hint="Skipping future classes (+0 P, +1 total)"
              value={skip}
              onChange={setSkip}
            />
            <SimRow
              icon={BadgeCheck}
              tone="bg-a1/10 text-a1"
              title="PC (absent → present)"
              hint={`Past absences changed to present (+1 P, +0 total) · up to ${maxPc}`}
              value={pcUsed}
              max={maxPc}
              onChange={setPc}
            />
          </div>
          <p className="mt-3 text-center text-xs text-subtle">Target {ATTENDANCE_TARGET}% · safe from {ATTENDANCE_TARGET + 5}%</p>
        </div>
      </div>
    </Sheet>
  );
}
