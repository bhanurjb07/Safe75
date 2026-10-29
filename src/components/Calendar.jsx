import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { formatLongDay, formatMonth, monthGrid, todayKey, weekdayNames } from '../utils/dates.js';
import { tapOnly } from '../utils/motion.js';
import { cn } from '../utils/status.js';

const MAX_DOTS = 6;

/**
 * Month calendar. Each day shows one dot per class: filled green = present, hollow red = absent.
 * byDate: Map<"YYYY-MM-DD", record[]>
 */
export default function Calendar({ year, month, direction, onMonthChange, canPrev, canNext, byDate, selected, onSelect }) {
  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const today = todayKey();
  const weekdays = weekdayNames('narrow');
  const weekdaysLong = weekdayNames('long');

  return (
    <div className="card card-pad">
      <div className="mb-4 flex items-center justify-between">
        <motion.button
          {...tapOnly}
          type="button"
          onClick={() => onMonthChange(-1)}
          disabled={!canPrev}
          aria-label="Previous month"
          className="grid h-10 w-10 place-items-center rounded-2xl bg-line/[0.05] text-muted hover:text-fg disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h2
            key={`${year}-${month}`}
            initial={{ opacity: 0, y: direction > 0 ? 8 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction > 0 ? -8 : 8 }}
            transition={{ duration: 0.2 }}
            className="text-lg font-bold"
            aria-live="polite"
          >
            {formatMonth(year, month)}
          </motion.h2>
        </AnimatePresence>
        <motion.button
          {...tapOnly}
          type="button"
          onClick={() => onMonthChange(1)}
          disabled={!canNext}
          aria-label="Next month"
          className="grid h-10 w-10 place-items-center rounded-2xl bg-line/[0.05] text-muted hover:text-fg disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" role="row">
        {weekdays.map((w, i) => (
          <abbr key={i} title={weekdaysLong[i]} className="pb-2 text-[11px] font-semibold uppercase text-subtle no-underline" role="columnheader">
            {w}
          </abbr>
        ))}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={`${year}-${month}`}
            custom={direction}
            initial={{ opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -48 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="grid grid-cols-7 gap-1"
            role="grid"
            aria-label={formatMonth(year, month)}
          >
            {cells.map((key, i) => {
              if (!key) return <div key={`blank-${i}`} />;
              const recs = byDate.get(key) ?? [];
              const absent = recs.filter((r) => r.isAbsent).length;
              const isSel = selected === key;
              const day = Number(key.slice(8));
              const label = `${formatLongDay(key)}: ${recs.length ? `${recs.length} classes, ${absent} absent` : 'no classes'}`;
              return (
                <motion.button
                  key={key}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onSelect(key)}
                  aria-label={label}
                  aria-pressed={isSel}
                  className={cn(
                    'relative flex h-[58px] flex-col items-center justify-start gap-1 rounded-2xl pt-1.5 text-sm font-semibold transition-colors sm:h-16 sm:pt-2',
                    recs.length === 0 && 'text-subtle',
                    recs.length > 0 && absent === 0 && 'bg-safe/[0.07] hover:bg-safe/15',
                    absent > 0 && absent < recs.length && 'bg-warn/[0.08] hover:bg-warn/15',
                    recs.length > 0 && absent === recs.length && 'bg-danger/[0.12] hover:bg-danger/20',
                    recs.length === 0 && 'hover:bg-line/5',
                    key === today && 'ring-1 ring-a3/70',
                  )}
                >
                  {isSel && (
                    <motion.span
                      layoutId="calendar-selected"
                      className="absolute inset-0 rounded-2xl ring-2 ring-a2"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative tabular">{day}</span>
                  {recs.length > 0 && (
                    <span className="relative flex max-w-[34px] flex-wrap justify-center gap-[3px]" aria-hidden="true">
                      {recs.slice(0, MAX_DOTS).map((r) => (
                        <span
                          key={r.id}
                          className={cn(
                            'h-[6px] w-[6px] rounded-full',
                            r.isAbsent ? 'border-[1.5px] border-danger bg-transparent' : 'bg-safe',
                          )}
                        />
                      ))}
                      {recs.length > MAX_DOTS && <span className="text-[8px] leading-none text-subtle">+</span>}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-safe" aria-hidden="true" /> Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border-[1.5px] border-danger" aria-hidden="true" /> Absent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded ring-1 ring-a3" aria-hidden="true" /> Today
        </span>
      </div>
    </div>
  );
}
