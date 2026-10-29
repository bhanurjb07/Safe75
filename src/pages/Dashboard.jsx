import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Layers, Share2, SlidersHorizontal, Sparkles, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BigPercent from '../components/BigPercent.jsx';
import CountUp from '../components/CountUp.jsx';
import DataGate from '../components/DataGate.jsx';
import PlanSheet, { SkipPill } from '../components/PlanSheet.jsx';
import ProgressRing from '../components/ProgressRing.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { SubjectMiniCard } from '../components/SubjectCard.jsx';
import SubjectDetail from '../components/SubjectDetail.jsx';
import { DashboardSkeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/States.jsx';
import WeeklyChart from '../components/WeeklyChart.jsx';
import { ATTENDANCE_TARGET } from '../config/env.js';
import { useShareCard } from '../hooks/useShareCard.js';
import { useAttendanceStore } from '../store/attendanceStore.js';
import { useAuthStore } from '../store/authStore.js';
import { buildInsights, motivation } from '../utils/analytics.js';
import { adviceSentence, mustAttend, safeToSkip, statusFor } from '../utils/attendance.js';
import { celebrateOnce } from '../utils/celebrate.js';
import { greeting } from '../utils/dates.js';
import { fadeUp, stagger } from '../utils/motion.js';
import { cn, statusMeta } from '../utils/status.js';

function Hero({ data, onPlan }) {
  const reduce = useReducedMotion();
  const share = useShareCard();
  const viewing = useAttendanceStore((s) => s.viewing);
  const { present, total, percentage } = data.overall;
  const status = statusFor(percentage);
  const meta = statusMeta(status);
  const Icon = meta.icon;
  const summary = { total, canSkip: safeToSkip(present, total), mustAttend: mustAttend(present, total) };

  useEffect(() => {
    if (status === 'safe' && !viewing) {
      const t = setTimeout(celebrateOnce, 1100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [status, viewing]);

  // A gentle shake once, then a soft pulse, when in danger.
  const ringAnim =
    status === 'danger' && !reduce ? { x: [0, -7, 7, -5, 5, -2, 0], transition: { delay: 1.6, duration: 0.6 } } : { x: 0 };

  return (
    <motion.section variants={fadeUp} className={cn('card overflow-hidden p-5 sm:p-7', meta.glow)} aria-labelledby="status-headline">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <motion.div className="absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl" animate={{ backgroundColor: `${meta.hex}26` }} transition={{ duration: 1 }} />
        <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-a2/10 blur-3xl" />
      </div>

      <div className="relative grid grid-cols-[1fr_auto] items-center gap-4 sm:gap-8">
        <div className="min-w-0">
          <p className="text-xl font-bold leading-tight sm:text-2xl">
            Overall
            <br />
            attendance
          </p>
          <p className="mt-2 font-extrabold tracking-tight">
            <CountUp value={present} className="text-5xl sm:text-7xl" duration={1.4} />
            <span className="text-2xl text-muted sm:text-4xl">
              /<CountUp value={total} duration={1.4} />
            </span>
          </p>
        </div>
        <motion.div animate={ringAnim} className="relative">
          {status === 'danger' && !reduce && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-3 rounded-full border-2 border-danger/50"
              animate={{ scale: [1, 1.12], opacity: [0.6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 2 }}
            />
          )}
          <div className="sm:hidden">
            <ProgressRing value={percentage} status={status} size={148} stroke={13} delay={0.25}>
              <BigPercent value={percentage} className={cn('text-[2.6rem]', meta.text)} delay={0.2} />
            </ProgressRing>
          </div>
          <div className="hidden sm:block">
            <ProgressRing value={percentage} status={status} size={210} stroke={17} delay={0.25}>
              <BigPercent value={percentage} className={cn('text-6xl', meta.text)} delay={0.2} />
            </ProgressRing>
          </div>
        </motion.div>
      </div>

      <div className="relative mt-5 grid grid-cols-[1fr_auto] items-center gap-3">
        <SkipPill present={present} total={total} className="min-w-0" />
        <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} onClick={onPlan} className="btn-primary rounded-full px-5">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Plan
        </motion.button>
      </div>

      <div className="relative mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line/10 pt-4">
        <h1 id="status-headline" className={cn('flex items-center gap-2 text-lg font-extrabold', meta.text)}>
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {meta.headline}
        </h1>
        <StatusBadge status={status} />
        <p className="w-full text-sm text-muted sm:w-auto sm:flex-1">{adviceSentence(summary)}</p>
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={share} className="btn-ghost px-3 py-2 text-xs">
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" /> Share
        </motion.button>
      </div>
    </motion.section>
  );
}

function InsightStrip({ insights }) {
  const { weakest, strongest, danger } = insights;
  const items = [
    weakest && { icon: TrendingDown, cls: 'text-danger-ink bg-danger/10', label: 'Weakest', title: weakest.name, value: `${weakest.percentage.toFixed(1)}%` },
    strongest && { icon: TrendingUp, cls: 'text-safe-ink bg-safe/10', label: 'Strongest', title: strongest.name, value: `${strongest.percentage.toFixed(1)}%` },
    {
      icon: Sparkles,
      cls: danger.length ? 'text-warn-ink bg-warn/10' : 'text-a3 bg-a3/10',
      label: 'In danger',
      title: danger.length ? `${danger.length} subject${danger.length === 1 ? '' : 's'} below ${ATTENDANCE_TARGET}%` : 'No subjects in danger',
      value: danger.length ? `${insights.recoverTotal} to recover` : 'All clear',
    },
  ].filter(Boolean);

  return (
    <motion.div variants={stagger(0.06)} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ icon: Icon, cls, label, title, value }, i) => (
        <motion.div key={label} variants={fadeUp} whileHover={{ y: -3 }} className={cn(i === 2 && 'sm:col-span-2 xl:col-span-1')}>
          <Link to="/insights" className="card flex h-full items-center gap-3 p-4">
            <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', cls)}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="eyebrow">{label}</span>
                <span className="shrink-0 text-sm font-bold tabular">{value}</span>
              </span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-fg/90">{title}</span>
            </span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

function DashboardView({ data }) {
  const profile = useAuthStore((s) => s.profile);
  const [selected, setSelected] = useState(null);
  const [planOpen, setPlanOpen] = useState(false);
  const insights = useMemo(() => buildInsights(data), [data]);
  const status = statusFor(data.overall.percentage);
  const firstName = profile?.firstName ?? '';

  return (
    <motion.div initial="hidden" animate="show" variants={stagger(0.08)} className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-sm text-muted">
          {greeting()}
          {firstName ? `, ${firstName}` : ''} 👋
        </p>
        <p className="text-xs text-subtle">{motivation(status)}</p>
      </motion.div>

      <Hero data={data} onPlan={() => setPlanOpen(true)} />

      <motion.div variants={fadeUp}>
        <WeeklyChart records={data.records} />
      </motion.div>

      <motion.div variants={stagger(0.07)} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Present" value={data.overall.present} tone="safe" hint="classes attended" delay={0.2} />
        <StatCard icon={XCircle} label="Absent" value={data.overall.absent} tone="danger" hint="classes missed" delay={0.25} />
        <StatCard icon={Layers} label="Total classes" value={data.overall.total} tone="a1" hint="held so far" delay={0.3} />
        <StatCard icon={Sparkles} label="Extra lectures" value={data.extra.present} tone="a3" hint={`of ${data.extra.total} attended · in total`} delay={0.35} />
      </motion.div>

      <InsightStrip insights={insights} />

      <motion.section variants={fadeUp} aria-labelledby="by-risk">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 id="by-risk" className="text-lg font-bold">
              Subjects by risk
            </h2>
            <p className="text-xs text-muted">Lowest attendance first</p>
          </div>
          <Link to="/subjects" className="group flex items-center gap-1 text-sm font-semibold text-a2">
            See all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
        {insights.subjects.length === 0 ? (
          <EmptyState title="No subjects yet" message="Your ERP hasn't listed any subjects for this semester." />
        ) : (
          <motion.div variants={stagger(0.05)} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {insights.subjects.slice(0, 6).map((s) => (
              <SubjectMiniCard key={s.id} subject={s} onOpen={setSelected} />
            ))}
          </motion.div>
        )}
      </motion.section>

      <SubjectDetail subject={selected} records={data.records} onClose={() => setSelected(null)} morph={false} />
      <PlanSheet open={planOpen} onClose={() => setPlanOpen(false)} data={data} />
    </motion.div>
  );
}

export default function Dashboard() {
  return <DataGate skeleton={<DashboardSkeleton />}>{(data) => <DashboardView data={data} />}</DataGate>;
}
