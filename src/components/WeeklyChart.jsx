import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { weekBuckets, weekStartKey } from '../utils/analytics.js';
import { formatDay, fromDateKey, keyOf, todayKey } from '../utils/dates.js';
import { EASE_OUT, tapOnly } from '../utils/motion.js';
import { cn } from '../utils/status.js';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BAR_H = 120;

const shiftWeek = (key, weeks) => {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + weeks * 7);
  return keyOf(d);
};

function Bar({ value, max, tone, delay }) {
  const h = value > 0 ? Math.max(8, (value / max) * BAR_H) : 4;
  return (
    <div className="flex w-3.5 flex-col items-center justify-end sm:w-4" style={{ height: BAR_H + 18 }}>
      {value > 0 && (
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.3 }}
          className={cn('mb-1 text-xs font-bold tabular', tone === 'absent' ? 'text-danger-ink' : 'text-safe-ink')}
        >
          {value}
        </motion.span>
      )}
      <motion.span
        className={cn('w-full rounded-t-[4px] rounded-b-[2px]', value === 0 ? 'bg-line/10' : tone === 'absent' ? 'bg-danger shadow-glow-red' : 'bg-safe shadow-[0_0_10px_rgb(var(--a1)/0.6)]')}
        initial={{ height: 0 }}
        animate={{ height: h }}
        transition={{ duration: 0.7, ease: EASE_OUT, delay }}
      />
    </div>
  );
}

/** Present vs absent per day for one week, with week-by-week navigation. */
export default function WeeklyChart({ records }) {
  const bounds = useMemo(() => {
    if (!records.length) return null;
    return { first: weekStartKey(records[0].date), last: weekStartKey(records[records.length - 1].date) };
  }, [records]);
  const [state, setState] = useState(() => ({ week: bounds?.last ?? weekStartKey(todayKey()), dir: 0 }));
  const days = useMemo(() => weekBuckets(records, state.week), [records, state.week]);

  if (!bounds) return null;
  const canPrev = state.week > bounds.first;
  const canNext = state.week < bounds.last;
  const max = Math.max(1, ...days.flatMap((d) => [d.present, d.absent]));
  const totals = days.reduce((a, d) => ({ present: a.present + d.present, absent: a.absent + d.absent }), { present: 0, absent: 0 });
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(fromDateKey(state.week));
  const go = (dir) => setState((s) => ({ week: shiftWeek(s.week, dir), dir }));

  return (
    <section className="card card-pad" aria-labelledby="weekly-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="weekly-title" className="text-lg font-bold">
            Weekly attendance
          </h2>
          <p className="text-sm text-muted">Present vs absent</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={state.week} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-0.5 text-xs text-subtle">
              {monthLabel} · week of {formatDay(state.week)}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex gap-2">
          <motion.button
            {...tapOnly}
            type="button"
            onClick={() => go(-1)}
            disabled={!canPrev}
            aria-label="Previous week"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-line/[0.06] text-muted hover:text-fg disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          <motion.button
            {...tapOnly}
            type="button"
            onClick={() => go(1)}
            disabled={!canNext}
            aria-label="Next week"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-line/[0.06] text-muted hover:text-fg disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={state.week}
            initial={{ opacity: 0, x: state.dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: state.dir * -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="grid grid-cols-6 gap-1"
            role="img"
            aria-label={`Week of ${formatDay(state.week)}: ${totals.present} present, ${totals.absent} absent`}
          >
            {days.map((d, i) => {
              const isToday = d.key === todayKey();
              return (
                <div key={d.key} className="flex flex-col items-center">
                  <div className="flex items-end gap-1">
                    <Bar value={d.absent} max={max} tone="absent" delay={i * 0.05} />
                    <Bar value={d.present} max={max} tone="present" delay={i * 0.05 + 0.03} />
                  </div>
                  <p className={cn('mt-2 text-sm font-bold', isToday ? 'text-a2' : 'text-fg')}>{DAY_NAMES[i]}</p>
                  <p className="text-[11px] text-subtle tabular">{formatDay(d.key)}</p>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/10 pt-3 text-xs">
        <div className="flex items-center gap-4 text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-safe" aria-hidden="true" /> Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-danger" aria-hidden="true" /> Absent
          </span>
        </div>
        <p className="font-semibold tabular">
          <span className="text-safe-ink">{totals.present} present</span>
          <span className="text-subtle"> · </span>
          <span className="text-danger-ink">{totals.absent} absent</span>
        </p>
      </div>
      {/* Same data as a table for screen readers */}
      <table className="sr-only">
        <caption>Attendance for the week of {formatDay(state.week)}</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Present</th>
            <th>Absent</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d, i) => (
            <tr key={d.key}>
              <td>{`${DAY_NAMES[i]} ${formatDay(d.key)}`}</td>
              <td>{d.present}</td>
              <td>{d.absent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
