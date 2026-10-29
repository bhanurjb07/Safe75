import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ListChecks, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { subjectTrend } from '../utils/analytics.js';
import { formatLongDay } from '../utils/dates.js';
import { fadeUp, stagger } from '../utils/motion.js';
import { cn, statusMeta } from '../utils/status.js';
import AttendanceMarks, { classesLabel, groupBy } from './AttendanceMarks.jsx';
import BigPercent from './BigPercent.jsx';
import CountUp from './CountUp.jsx';
import Segmented from './Segmented.jsx';
import Sheet from './Sheet.jsx';
import StatusBadge, { TypeBadge } from './StatusBadge.jsx';
import { AttendanceBar, SkipLine } from './SubjectCard.jsx';
import TrendChart from './TrendChart.jsx';
import WhatIfSlider from './WhatIfSlider.jsx';

const PAGE = 20;

/** One row per day; a day with several classes shows every mark, e.g. "A A" or "P A". */
function DailyRecords({ records }) {
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(PAGE);
  const days = useMemo(() => groupBy(records, (r) => r.date), [records]);
  const counts = { all: records.length, absent: records.filter((r) => r.isAbsent).length };
  counts.present = counts.all - counts.absent;
  // Absent / Present show the days that had at least one class of that kind.
  const shown = days.filter(([, recs]) => filter === 'all' || recs.some((r) => (filter === 'absent' ? r.isAbsent : !r.isAbsent)));

  return (
    <section aria-labelledby="daily-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 id="daily-title" className="flex items-center gap-2 font-bold">
          <ListChecks className="h-4 w-4 text-a2" aria-hidden="true" /> Daily attendance records
        </h3>
        <Segmented
          label="Filter records"
          size="sm"
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setLimit(PAGE);
          }}
          options={[
            { value: 'all', label: `All ${counts.all}` },
            { value: 'absent', label: `Absent ${counts.absent}` },
            { value: 'present', label: `Present ${counts.present}` },
          ]}
        />
      </div>
      {shown.length === 0 ? (
        <p className="rounded-2xl bg-line/[0.04] py-6 text-center text-sm text-muted">
          {records.length ? 'Nothing here for this filter.' : 'No day-by-day records for this subject yet.'}
        </p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {shown.slice(0, limit).map(([date, recs], i) => {
              const absent = recs.filter((r) => r.isAbsent).length;
              const allAbsent = absent === recs.length;
              return (
                <motion.li
                  key={date}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.025 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3',
                    allAbsent ? 'border-danger/20 bg-danger/[0.05]' : absent ? 'border-warn/20 bg-warn/[0.05]' : 'border-line/10 bg-line/[0.03]',
                  )}
                >
                  {absent === 0 ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-safe-ink" aria-hidden="true" />
                  ) : (
                    <XCircle className={cn('h-5 w-5 shrink-0', allAbsent ? 'text-danger-ink' : 'text-warn-ink')} aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{formatLongDay(date)}</span>
                    <span className="text-xs text-muted">
                      {classesLabel(recs)}
                    </span>
                  </span>
                  <AttendanceMarks records={recs} delay={Math.min(i, 10) * 0.025} />
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
      {shown.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="btn-ghost mt-3 w-full">
          Show more ({shown.length - limit} more days)
        </button>
      )}
    </section>
  );
}

/** Detail sheet for one subject: headline numbers, advice, trend, what-if and the full daily log. */
export default function SubjectDetail({ subject, records, onClose, morph = true }) {
  const trend = useMemo(() => (subject ? subjectTrend(records, subject.id) : []), [records, subject]);
  const log = useMemo(
    () => (subject ? records.filter((r) => r.subjectId === subject.id).sort((a, b) => b.date.localeCompare(a.date)) : []),
    [records, subject],
  );
  const meta = statusMeta(subject?.status);

  return (
    <Sheet
      open={Boolean(subject)}
      onClose={onClose}
      layoutId={morph && subject ? `subject-${subject.id}` : undefined}
      size="lg"
      title={subject?.name}
      subtitle={
        subject && (
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs">{subject.code}</span>
            <TypeBadge isLab={subject.isLab} />
            <StatusBadge status={subject.status} />
          </span>
        )
      }
    >
      {subject && (
        <motion.div initial="hidden" animate="show" variants={stagger(0.06, 0.12)} className="space-y-6">
          <motion.section variants={fadeUp} className={cn('rounded-3xl border p-5', meta.border, meta.soft)}>
            <div className="flex items-end justify-between gap-4">
              <BigPercent value={subject.percentage} className={cn('text-5xl', meta.text)} delay={0.15} />
              <p className="text-right font-extrabold tracking-tight">
                <CountUp value={subject.present} className="text-5xl" delay={0.15} />
                <span className="text-2xl text-muted">/{subject.total}</span>
              </p>
            </div>
            <AttendanceBar value={subject.percentage} status={subject.status} className="mt-4 h-3" delay={0.3} />
            <div className="mt-4 rounded-2xl bg-card/70 px-4 py-3 shadow-sm ring-1 ring-line/5">
              <SkipLine subject={subject} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted tabular">
              <span>
                Absent <strong className="text-fg">{subject.absent}</strong>
              </span>
              <span>
                Extra lectures{' '}
                <strong className="text-fg">
                  {subject.extra.present}/{subject.extra.total}
                </strong>
              </span>
            </div>
          </motion.section>

          {trend.length > 1 && (
            <motion.section variants={fadeUp}>
              <h3 className="eyebrow mb-2">Trend</h3>
              <TrendChart data={trend} height={170} label={`${subject.name} attendance over time`} />
            </motion.section>
          )}

          <motion.section variants={fadeUp}>
            <h3 className="eyebrow mb-2">What if…</h3>
            <WhatIfSlider present={subject.present} total={subject.total} max={20} compact />
          </motion.section>

          <motion.div variants={fadeUp}>
            <DailyRecords key={subject.id} records={log} />
          </motion.div>
        </motion.div>
      )}
    </Sheet>
  );
}
