import { motion } from 'framer-motion';
import { CalendarClock, CalendarOff, CalendarRange, CheckCircle2, Flame, TrendingDown, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import Calendar from '../components/Calendar.jsx';
import AttendanceMarks, { classesLabel, groupBy } from '../components/AttendanceMarks.jsx';
import CountUp from '../components/CountUp.jsx';
import DataGate from '../components/DataGate.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Sheet from '../components/Sheet.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/States.jsx';
import TrendChart from '../components/TrendChart.jsx';
import { groupByDate, longestAbsentStreak, monthSummary, mostMissedSubject, runningPercentage } from '../utils/analytics.js';
import { statusFor } from '../utils/attendance.js';
import { formatDay, formatLongDay, formatMonth, fromDateKey } from '../utils/dates.js';
import { fadeUp, stagger } from '../utils/motion.js';
import { cn, plural, statusMeta } from '../utils/status.js';

function MonthStrip({ summary, year, month }) {
  const meta = statusMeta(statusFor(summary.percentage));
  const items = [
    { label: 'Class days', value: summary.days, icon: CalendarRange, cls: 'text-a1' },
    { label: 'Present', value: summary.present, icon: CheckCircle2, cls: 'text-safe-ink' },
    { label: 'Absent', value: summary.absent, icon: XCircle, cls: 'text-danger-ink' },
  ];
  return (
    <motion.div variants={fadeUp} className="card card-pad">
      <p className="eyebrow">{formatMonth(year, month)} summary</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4">
        {items.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="rounded-2xl bg-line/[0.04] p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Icon className={cn('h-3.5 w-3.5', cls)} aria-hidden="true" /> {label}
            </p>
            <p className="mt-1 text-2xl font-bold">
              <CountUp key={`${year}-${month}-${label}`} value={value} duration={0.7} />
            </p>
          </div>
        ))}
        <div className={cn('rounded-2xl p-3', meta.soft)}>
          <p className={cn('flex items-center gap-1.5 text-xs', meta.text)}>
            <meta.icon className="h-3.5 w-3.5" aria-hidden="true" /> This month
          </p>
          <p className={cn('mt-1 text-2xl font-bold', meta.text)}>
            {summary.total ? <CountUp key={`${year}-${month}-pct`} value={summary.percentage} decimals={1} suffix="%" duration={0.7} /> : '—'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Highlight({ icon: Icon, cls, label, title, detail }) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3 }} className="card flex items-start gap-3 p-5">
      <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', cls)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="eyebrow">{label}</p>
        <p className="mt-0.5 font-bold">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{detail}</p>
      </div>
    </motion.div>
  );
}

function HistoryView({ data }) {
  const { records } = data;
  const byDate = useMemo(() => groupByDate(records), [records]);
  const trend = useMemo(() => runningPercentage(records), [records]);
  const streak = useMemo(() => longestAbsentStreak(records), [records]);
  const missed = useMemo(() => mostMissedSubject(data.subjects), [data.subjects]);

  const first = records[0]?.date;
  const last = records[records.length - 1]?.date;
  const lastDate = last ? fromDateKey(last) : new Date();
  const [cursor, setCursor] = useState({ y: lastDate.getFullYear(), m: lastDate.getMonth(), dir: 0 });
  const [selected, setSelected] = useState(null);
  const summary = useMemo(() => monthSummary(records, cursor.y, cursor.m), [records, cursor.y, cursor.m]);

  const idx = (y, m) => y * 12 + m;
  const firstD = first ? fromDateKey(first) : lastDate;
  const canPrev = idx(cursor.y, cursor.m) > idx(firstD.getFullYear(), firstD.getMonth());
  const canNext = idx(cursor.y, cursor.m) < idx(lastDate.getFullYear(), lastDate.getMonth());
  const changeMonth = (d) =>
    setCursor((c) => {
      const t = new Date(c.y, c.m + d, 1);
      return { y: t.getFullYear(), m: t.getMonth(), dir: d };
    });

  const dayRecords = selected ? byDate.get(selected) ?? [] : [];
  const dayAbsent = dayRecords.filter((r) => r.isAbsent).length;

  if (!records.length) {
    return (
      <>
        <PageHeader title="History" />
        <EmptyState icon={CalendarOff} title="No day-by-day log yet" message="Your ERP hasn't shared individual class records for this semester." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`${formatDay(first)} – ${formatDay(last)}`}
        title="History"
        description="Every class, day by day. Tap a day to see what you attended."
      />
      <motion.div initial="hidden" animate="show" variants={stagger(0.08)} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          <motion.div variants={fadeUp}>
            <Calendar
              year={cursor.y}
              month={cursor.m}
              direction={cursor.dir}
              onMonthChange={changeMonth}
              canPrev={canPrev}
              canNext={canNext}
              byDate={byDate}
              selected={selected}
              onSelect={setSelected}
            />
          </motion.div>
          <div className="space-y-5">
            <MonthStrip summary={summary} year={cursor.y} month={cursor.m} />
            <motion.div variants={stagger(0.06)} className="grid gap-3">
              <Highlight
                icon={TrendingDown}
                cls="bg-danger/10 text-danger-ink"
                label="Most missed subject"
                title={missed ? missed.name : 'None — perfect record'}
                detail={missed ? `${plural(missed.absent, 'class', 'classes')} missed · ${missed.percentage.toFixed(1)}%` : 'You have not missed any class.'}
              />
              <Highlight
                icon={Flame}
                cls="bg-warn/10 text-warn-ink"
                label="Longest absent streak"
                title={streak.days ? plural(streak.days, 'day', 'days') + ' in a row' : 'No full days missed'}
                detail={
                  streak.days
                    ? streak.days === 1
                      ? `Missed every class on ${formatDay(streak.from)}`
                      : `${formatDay(streak.from)} – ${formatDay(streak.to)}, every class missed`
                    : 'You attended at least one class every class day.'
                }
              />
            </motion.div>
          </div>
        </div>

        <motion.section variants={fadeUp} className="card card-pad" aria-labelledby="trend-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="trend-title" className="font-bold">
                Attendance over time
              </h2>
              <p className="text-xs text-muted">Running percentage from the day-by-day log</p>
            </div>
            <CalendarClock className="h-5 w-5 text-a2" aria-hidden="true" />
          </div>
          <TrendChart data={trend} height={240} />
        </motion.section>
      </motion.div>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        size="sm"
        title={selected ? formatLongDay(selected) : ''}
        subtitle={
          dayRecords.length
            ? `${plural(dayRecords.length, 'class', 'classes')} · ${dayRecords.length - dayAbsent} present, ${dayAbsent} absent`
            : 'No classes recorded'
        }
      >
        {dayRecords.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No classes were held on this day.</p>
        ) : (
          <motion.ul initial="hidden" animate="show" variants={stagger(0.05, 0.1)} className="space-y-2">
            {groupBy(dayRecords, (r) => r.subjectId ?? r.subjectName).map(([key, recs]) => {
              const absent = recs.filter((r) => r.isAbsent).length;
              const allAbsent = absent === recs.length;
              return (
                <motion.li
                  key={key}
                  variants={fadeUp}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border p-3',
                    allAbsent ? 'border-danger/25 bg-danger/[0.07]' : absent ? 'border-warn/25 bg-warn/[0.07]' : 'border-safe/25 bg-safe/[0.07]',
                  )}
                >
                  {absent === 0 ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-safe-ink" aria-hidden="true" />
                  ) : (
                    <XCircle className={cn('h-5 w-5 shrink-0', allAbsent ? 'text-danger-ink' : 'text-warn-ink')} aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{recs[0].subjectName}</span>
                    <span className="text-xs text-muted">{classesLabel(recs)}</span>
                  </span>
                  <AttendanceMarks records={recs} size="sm" delay={0.15} />
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </Sheet>
    </>
  );
}

export default function History() {
  return (
    <DataGate
      skeleton={
        <>
          <PageHeader title="History" />
          <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            <Skeleton className="h-[420px] !rounded-3xl" />
            <div className="space-y-5">
              <Skeleton className="h-36 !rounded-3xl" />
              <Skeleton className="h-24 !rounded-3xl" />
              <Skeleton className="h-24 !rounded-3xl" />
            </div>
          </div>
        </>
      }
    >
      {(data) => <HistoryView data={data} />}
    </DataGate>
  );
}
