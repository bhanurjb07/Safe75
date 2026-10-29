import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Minus, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import CountUp from '../components/CountUp.jsx';
import DataGate from '../components/DataGate.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ProgressRing from '../components/ProgressRing.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import WhatIfSlider from '../components/WhatIfSlider.jsx';
import { ATTENDANCE_TARGET } from '../config/env.js';
import { classesPerWeek, subjectsWithStats } from '../utils/analytics.js';
import { adviceSentence, percentage, statusFor, summarize } from '../utils/attendance.js';
import { subjectInitials } from '../utils/subjectNames.js';
import { fadeUp, spring, stagger, tapOnly } from '../utils/motion.js';
import { cn, statusMeta } from '../utils/status.js';

function SubjectPicker({ options, value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Choose a subject" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {options.map((o) => {
        const active = o.id === value;
        const meta = statusMeta(o.status);
        return (
          <motion.button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(o.id)}
            title={o.name}
            className={cn(
              'relative shrink-0 rounded-2xl px-3.5 py-2 text-sm font-semibold transition-colors',
              active ? 'text-white' : 'glass text-muted hover:text-fg',
            )}
          >
            {active && <motion.span layoutId="planner-pick" transition={spring} className="absolute inset-0 rounded-2xl bg-accent-gradient shadow-glow" />}
            <span className="relative flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', meta.bg)} aria-hidden="true" />
              {o.short}
              <span className={cn('tabular text-xs', active ? 'text-white/80' : 'text-subtle')}>{o.percentage.toFixed(0)}%</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function Stepper({ value, min = 0, max, onChange, label }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <motion.button
        {...tapOnly}
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Fewer: ${label}`}
        className="grid h-8 w-8 place-items-center rounded-xl bg-line/[0.06] text-muted hover:text-fg disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" />
      </motion.button>
      <span className="w-7 text-center font-bold tabular">
        {value}
      </span>
      <motion.button
        {...tapOnly}
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`More: ${label}`}
        className="grid h-8 w-8 place-items-center rounded-xl bg-line/[0.06] text-muted hover:text-fg disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" />
      </motion.button>
    </div>
  );
}

function WeekPlanner({ data, subjects }) {
  const [miss, setMiss] = useState({});
  const rows = useMemo(
    () => subjects.map((s) => ({ ...s, perWeek: classesPerWeek(data.records, s.id, s.isLab ? 1 : 3) })),
    [subjects, data.records],
  );
  const heldTotal = rows.reduce((a, r) => a + r.perWeek, 0);
  const missedTotal = rows.reduce((a, r) => a + (miss[r.id] ?? 0), 0);
  const P = data.overall.present + heldTotal - missedTotal;
  const T = data.overall.total + heldTotal;
  const pct = percentage(P, T);
  const status = statusFor(pct);
  const meta = statusMeta(status);
  const Icon = meta.icon;

  return (
    <motion.section variants={fadeUp} className="card card-pad" aria-labelledby="week-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="week-title" className="flex items-center gap-2 text-lg font-bold">
            <CalendarDays className="h-5 w-5 text-a2" aria-hidden="true" /> Plan my week
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted">
            Choose how many classes you plan to miss. Classes per week are estimated from your recent timetable.
          </p>
        </div>
        <motion.button {...tapOnly} type="button" onClick={() => setMiss({})} disabled={!missedTotal} className="btn-ghost py-2 text-xs">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
        </motion.button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ul className="divide-y divide-line/[0.07]">
          {rows.map((r) => {
            const m = miss[r.id] ?? 0;
            const sp = percentage(r.present + r.perWeek - m, r.total + r.perWeek);
            const sStatus = statusFor(sp);
            const sMeta = statusMeta(sStatus);
            const SIcon = sMeta.icon;
            return (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted tabular">~{r.perWeek} this week</p>
                </div>
                <motion.span
                  key={sStatus}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn('hidden items-center gap-1 text-xs font-bold tabular sm:flex', sMeta.text)}
                >
                  <SIcon className="h-3.5 w-3.5" aria-label={sMeta.label} />
                  {sp.toFixed(1)}%
                </motion.span>
                <Stepper
                  label={`classes to miss in ${r.name}`}
                  value={m}
                  max={r.perWeek}
                  onChange={(v) => setMiss((s) => ({ ...s, [r.id]: v }))}
                />
              </li>
            );
          })}
        </ul>

        <div className={cn('relative self-start overflow-hidden rounded-3xl border p-6 text-center transition-colors duration-500 lg:sticky lg:top-24', meta.border, meta.soft)} aria-live="polite">
          <p className="eyebrow">Projected overall after this week</p>
          <div className="mt-4 flex justify-center">
            <ProgressRing value={pct} status={status} size={170} stroke={13} delay={0}>
              <span className={cn('text-3xl font-extrabold tracking-tight', meta.text)}>
                <CountUp value={pct} decimals={2} suffix="%" duration={0.5} />
              </span>
            </ProgressRing>
          </div>
          <p className={cn('mt-3 flex items-center justify-center gap-1.5 font-bold', meta.text)}>
            <Icon className="h-4 w-4" aria-hidden="true" /> {meta.headline}
          </p>
          <p className="mt-1 text-sm text-muted tabular">
            Missing {missedTotal} of ~{heldTotal} classes · {P}/{T}
          </p>
          <AnimatePresence mode="wait">
            <motion.p key={status} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm">
              {adviceSentence(summarize(P, T))}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}

function PlannerView({ data }) {
  const subjects = useMemo(() => subjectsWithStats(data.subjects), [data.subjects]);
  const options = useMemo(
    () => [
      { id: 'overall', name: 'Overall', short: 'Overall', ...summarize(data.overall.present, data.overall.total), percentage: data.overall.percentage },
      ...subjects.map((s) => {
        const isLabName = /\slab$/i.test(s.name);
        const base = subjectInitials(isLabName ? s.name.replace(/\s+lab$/i, '') : s.name);
        return { ...s, short: isLabName ? `${base} Lab` : base };
      }),
    ],
    [data.overall, subjects],
  );
  const [pick, setPick] = useState('overall');
  const current = options.find((o) => o.id === pick) ?? options[0];
  const meta = statusMeta(current.status);

  return (
    <>
      <PageHeader
        eyebrow="What-if calculator"
        title="Planner"
        description={`Try out skips and catch-up classes and see where you'd land against ${ATTENDANCE_TARGET}%.`}
      />
      <motion.div initial="hidden" animate="show" variants={stagger(0.08)} className="space-y-5">
        <motion.div variants={fadeUp}>
          <SubjectPicker options={options} value={pick} onChange={setPick} />
        </motion.div>

        <motion.section variants={fadeUp} className="card card-pad">
          <AnimatePresence mode="wait">
            <motion.div key={pick} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow">{pick === 'overall' ? 'All subjects' : current.code}</p>
                  <h2 className="truncate text-xl font-bold">{current.name}</h2>
                </div>
                <p className="text-sm text-muted">
                  Now{' '}
                  <span className={cn('font-bold tabular', meta.text)}>{current.percentage.toFixed(2)}%</span>
                  <span className="tabular">
                    {' '}
                    · {current.present}/{current.total}
                  </span>
                </p>
              </div>
              <WhatIfSlider present={current.present} total={current.total} max={pick === 'overall' ? 60 : 25} />
            </motion.div>
          </AnimatePresence>
        </motion.section>

        <WeekPlanner data={data} subjects={subjects} />
      </motion.div>
    </>
  );
}

export default function Planner() {
  return (
    <DataGate
      skeleton={
        <>
          <PageHeader title="Planner" />
          <Skeleton className="mb-5 h-10 w-full" />
          <Skeleton className="h-72 !rounded-3xl" />
        </>
      }
    >
      {(data) => <PlannerView data={data} />}
    </DataGate>
  );
}
