import { motion } from 'framer-motion';
import { Award, CalendarX, HeartPulse, Quote, ShieldAlert, Target, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import DataGate from '../components/DataGate.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ListSkeleton } from '../components/Skeleton.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { AttendanceBar } from '../components/SubjectCard.jsx';
import { ATTENDANCE_TARGET } from '../config/env.js';
import { absencesByWeekday, buildInsights, motivation } from '../utils/analytics.js';
import { mustAttend, safeToSkip, statusFor } from '../utils/attendance.js';
import { weekdayNames } from '../utils/dates.js';
import { EASE_OUT, fadeUp, stagger } from '../utils/motion.js';
import { cn, plural, statusMeta } from '../utils/status.js';

function SubjectHighlight({ icon: Icon, label, subject, cls }) {
  if (!subject) return null;
  const meta = statusMeta(subject.status);
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3 }}>
      <Link to={`/subjects?open=${encodeURIComponent(subject.id)}`} className="card card-pad block h-full">
        <div className="flex items-center gap-3">
          <span className={cn('grid h-11 w-11 place-items-center rounded-2xl', cls)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="eyebrow">{label}</p>
        </div>
        <p className="mt-4 line-clamp-2 text-lg font-bold leading-snug">{subject.name}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className={cn('text-2xl font-extrabold tabular', meta.text)}>{subject.percentage.toFixed(1)}%</span>
          <StatusBadge status={subject.status} />
        </div>
        <AttendanceBar value={subject.percentage} status={subject.status} className="mt-3 h-2" />
      </Link>
    </motion.div>
  );
}

function WeekdayBars({ records }) {
  const { counts, worstIndex } = useMemo(() => absencesByWeekday(records), [records]);
  const names = weekdayNames('short');
  const longNames = weekdayNames('long');
  const shown = counts.map((c, i) => ({ ...c, i })).filter((c) => c.total > 0);
  const maxRate = Math.max(...shown.map((c) => c.absent / c.total), 0.01);
  if (!shown.length) return null;

  return (
    <motion.section variants={fadeUp} className="card card-pad" aria-labelledby="weekday-title">
      <h2 id="weekday-title" className="flex items-center gap-2 font-bold">
        <CalendarX className="h-5 w-5 text-a2" aria-hidden="true" /> When you miss classes
      </h2>
      <p className="mt-1 text-sm text-muted">
        {worstIndex >= 0 ? (
          <>
            You miss the most on <strong className="text-fg">{longNames[worstIndex]}s</strong>. Worth keeping an eye on.
          </>
        ) : (
          'No absences in the log.'
        )}
      </p>
      <ul className="mt-5 space-y-2.5">
        {shown.map((c) => {
          const rate = c.absent / c.total;
          return (
            <li key={c.i} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 text-sm">
              <span className={cn('font-semibold', c.i === worstIndex ? 'text-fg' : 'text-muted')}>{names[c.i]}</span>
              <span className="relative h-3 overflow-hidden rounded-full bg-line/[0.07]" aria-hidden="true">
                <motion.span
                  className={cn('absolute inset-y-0 left-0 rounded-full', c.i === worstIndex ? 'bg-accent-gradient' : 'bg-a2/50')}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(rate / maxRate) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: EASE_OUT, delay: c.i * 0.05 }}
                />
              </span>
              <span className="w-28 text-right text-xs text-muted tabular">
                {c.absent} of {c.total} missed
              </span>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}

function InsightsView({ data }) {
  const insights = useMemo(() => buildInsights(data), [data]);
  const { present, total, percentage } = data.overall;
  const status = statusFor(percentage);
  const meta = statusMeta(status);
  const Icon = meta.icon;
  const skip = safeToSkip(present, total);
  const need = mustAttend(present, total);

  return (
    <>
      <PageHeader eyebrow="What your numbers say" title="Insights" />
      <motion.div initial="hidden" animate="show" variants={stagger(0.08)} className="space-y-5">
        <motion.section variants={fadeUp} className={cn('card card-pad overflow-hidden', meta.glow)}>
          <motion.div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
            style={{ background: `${meta.hex}33` }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <Quote className="relative h-7 w-7 text-a2" aria-hidden="true" />
          <p className="relative mt-3 text-xl font-bold leading-snug sm:text-2xl">{motivation(status)}</p>
          <p className={cn('relative mt-3 flex items-center gap-2 text-sm font-semibold', meta.text)}>
            <Icon className="h-4 w-4" aria-hidden="true" />
            {meta.headline} at {percentage.toFixed(2)}% ·{' '}
            {need > 0 ? `attend ${Number.isFinite(need) ? need : 'every'} classes to recover` : `${plural(skip, 'skip', 'skips')} available`}
          </p>
        </motion.section>

        <motion.div variants={stagger(0.06)} className="grid gap-4 md:grid-cols-2">
          <SubjectHighlight icon={TrendingDown} label="Weakest subject" subject={insights.weakest} cls="bg-danger/10 text-danger-ink" />
          <SubjectHighlight icon={Award} label="Strongest subject" subject={insights.strongest} cls="bg-safe/10 text-safe-ink" />
        </motion.div>

        <motion.section variants={fadeUp} className="card card-pad" aria-labelledby="danger-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="danger-title" className="flex items-center gap-2 font-bold">
              <ShieldAlert className="h-5 w-5 text-danger-ink" aria-hidden="true" /> Subjects in danger
            </h2>
            {insights.danger.length > 0 && (
              <span className="chip bg-danger/10 text-danger-ink">
                <Target className="h-3.5 w-3.5" aria-hidden="true" /> {insights.recoverTotal} classes to recover in total
              </span>
            )}
          </div>
          {insights.danger.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <HeartPulse className="h-4 w-4 text-safe-ink" aria-hidden="true" />
              Every subject is at or above {ATTENDANCE_TARGET}%. Nice work.
            </p>
          ) : (
            <motion.ul variants={stagger(0.05)} className="mt-4 space-y-3">
              {insights.danger.map((s) => (
                <motion.li key={s.id} variants={fadeUp}>
                  <Link
                    to={`/subjects?open=${encodeURIComponent(s.id)}`}
                    className="flex items-center gap-4 rounded-2xl border border-danger/20 bg-danger/[0.05] p-4 transition-colors hover:bg-danger/10"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{s.name}</p>
                      <AttendanceBar value={s.percentage} status={s.status} className="mt-2 h-1.5" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-danger-ink tabular">{s.percentage.toFixed(1)}%</p>
                      <p className="text-xs text-muted">attend {Number.isFinite(s.mustAttend) ? s.mustAttend : 'all'}</p>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
          {insights.edge.length > 0 && (
            <p className="mt-4 text-sm text-muted">
              On the edge: <span className="font-semibold text-warn-ink">{insights.edge.map((s) => s.name).join(', ')}</span>. Don&apos;t skip
              these casually.
            </p>
          )}
        </motion.section>

        <WeekdayBars records={data.records} />
      </motion.div>
    </>
  );
}

export default function Insights() {
  return (
    <DataGate
      skeleton={
        <>
          <PageHeader title="Insights" />
          <ListSkeleton count={4} />
        </>
      }
    >
      {(data) => <InsightsView data={data} />}
    </DataGate>
  );
}
