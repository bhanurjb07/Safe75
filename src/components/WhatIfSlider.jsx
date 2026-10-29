import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useState } from 'react';
import { ATTENDANCE_TARGET } from '../config/env.js';
import { mustAttend, percentage, projected, safeToSkip, statusFor } from '../utils/attendance.js';
import { statusMeta } from '../utils/status.js';
import CountUp from './CountUp.jsx';
import RangeSlider from './RangeSlider.jsx';

/** "If I skip X / attend Y" calculator with a live animated result. */
export default function WhatIfSlider({ present, total, max = 30, compact = false }) {
  const [skip, setSkip] = useState(0);
  const [attend, setAttend] = useState(0);
  const now = percentage(present, total);
  const next = projected(present, total, { attend, skip });
  const status = statusFor(next);
  const meta = statusMeta(status);
  const Icon = meta.icon;
  const delta = Math.round((next - now) * 100) / 100;
  const P = present + attend;
  const T = total + attend + skip;
  const skipLeft = safeToSkip(P, T);
  const need = mustAttend(P, T);
  const Trend = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;

  return (
    <div className={compact ? 'space-y-4' : 'grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-center'}>
      <div className="space-y-5">
        <RangeSlider label="If I skip" value={skip} max={max} onChange={setSkip} suffix="classes" tone="var(--danger)" />
        <RangeSlider label="If I attend" value={attend} max={max} onChange={setAttend} suffix="classes" tone="var(--safe)" />
      </div>

      <motion.div
        layout
        className={`relative overflow-hidden rounded-3xl border p-5 transition-colors duration-500 ${meta.border} ${meta.soft}`}
        aria-live="polite"
      >
        <motion.div
          aria-hidden="true"
          className="absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl"
          animate={{ backgroundColor: `${meta.hex}40` }}
          transition={{ duration: 0.6 }}
        />
        <p className="eyebrow relative">New attendance</p>
        <div className="relative mt-1 flex items-end gap-3">
          <span className={`text-5xl font-extrabold tracking-tight transition-colors duration-500 ${meta.text}`}>
            <CountUp value={next} decimals={2} suffix="%" duration={0.5} />
          </span>
          <span className="mb-2 inline-flex items-center gap-0.5 rounded-full bg-line/[0.07] px-2 py-0.5 text-xs font-semibold tabular text-muted">
            <Trend className="h-3.5 w-3.5" aria-hidden="true" />
            {delta > 0 ? '+' : ''}
            {delta.toFixed(2)}
          </span>
        </div>
        <div className="relative mt-3 flex items-center gap-2 text-sm font-semibold">
          <Icon className={`h-4 w-4 ${meta.text}`} aria-hidden="true" />
          <span>{meta.label}</span>
          <span className="font-normal text-muted tabular">
            · {P}/{T} classes
          </span>
        </div>
        <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-line/10">
          <motion.div
            className={`h-full rounded-full ${meta.bg}`}
            animate={{ width: `${Math.min(100, next)}%` }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
          />
          <div className="absolute inset-y-0 w-0.5 bg-fg/70" style={{ left: `${ATTENDANCE_TARGET}%` }} aria-hidden="true" />
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={need > 0 ? `n${need}` : `s${skipLeft}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="relative mt-3 text-sm text-muted"
          >
            {need > 0
              ? `Then you'd need ${Number.isFinite(need) ? need : 'too many'} more classes in a row to reach ${ATTENDANCE_TARGET}%.`
              : skipLeft > 0
                ? `You'd still have ${skipLeft} skip${skipLeft === 1 ? '' : 's'} to spare.`
                : `You'd be right on the ${ATTENDANCE_TARGET}% line.`}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
