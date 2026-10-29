import { AnimatePresence, motion } from 'framer-motion';
import { Calculator, ChevronDown, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import Logo from '../components/Logo.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ATTENDANCE_TARGET } from '../config/env.js';
import { fadeUp, stagger } from '../utils/motion.js';

const T = ATTENDANCE_TARGET;
const R = (T / 100).toFixed(2);

const FAQ = [
  {
    q: 'How is "can skip" worked out?',
    a: `floor(present ÷ ${R} − total). It's the number of classes you can miss in a row and still be at ${T}% or above.`,
  },
  {
    q: 'How is "need N" worked out?',
    a: `ceil((${R} × total − present) ÷ (1 − ${R})). It's how many classes you must attend in a row to get back to ${T}%.`,
  },
  {
    q: 'What do Safe, Borderline and Danger mean?',
    a: `Safe is ${T + 5}% or more. Borderline is between ${T}% and ${T + 5}%. Danger is below ${T}%.`,
  },
  {
    q: 'Do extra lectures count?',
    a: 'Yes. Regular classes plus extra lectures make up your total, and both appear in the daily log. Extra lectures have a dashed outline around their P / A mark.',
  },
  {
    q: 'My numbers look different from the ERP website.',
    a: 'Safe75 shows exactly what the ERP sends. Pull down (or tap refresh) to fetch the latest data. If they still differ, the ERP may have changed.',
  },
];

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.li variants={fadeUp} className="overflow-hidden rounded-2xl bg-line/[0.04]">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left font-semibold">
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-subtle transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 text-sm text-muted">
            <span className="block pb-4">{a}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export default function About() {
  return (
    <>
      <PageHeader eyebrow="Safe75" title="Contact & About" />
      <motion.div initial="hidden" animate="show" variants={stagger(0.07)} className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          <motion.section variants={fadeUp} className="card card-pad">
            <Logo size={44} />
            <p className="mt-4 text-lg font-bold">Stay safe above {T}%.</p>
            <p className="mt-1 text-sm text-muted">
              Safe75 reads your attendance from your college ERP and turns it into clear answers: are you safe, how many classes can you skip, and how many must you
              attend.
            </p>
            <p className="mt-4 text-xs text-subtle">Version 1.1</p>
          </motion.section>

          <motion.section variants={fadeUp} className="card card-pad space-y-3">
            <h2 className="flex items-center gap-2 font-bold">
              <Lock className="h-4 w-4 text-a2" aria-hidden="true" /> Privacy
            </h2>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-safe-ink" aria-hidden="true" />
                Your password goes only to your college ERP and is never stored.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-safe-ink" aria-hidden="true" />
                Your session and attendance stay in this browser tab and are cleared when you sign out or close it.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-safe-ink" aria-hidden="true" />
                Only your name, roll number and semester are shown. Nothing else from your profile is kept.
              </li>
            </ul>
          </motion.section>

          <motion.section variants={fadeUp} className="flex gap-3 rounded-3xl border border-warn/30 bg-warn/10 p-5 text-sm">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warn-ink" aria-hidden="true" />
            <p className="text-muted">
              <strong className="text-fg">Unofficial tool.</strong> Safe75 is not made by or affiliated with your college or AKTU. It uses an undocumented ERP
              API and may stop working if the ERP changes. Use it only with your own account.
            </p>
          </motion.section>
        </div>

        <motion.section variants={fadeUp} className="card card-pad">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Calculator className="h-4 w-4 text-a3" aria-hidden="true" /> How it works
          </h2>
          <motion.ul variants={stagger(0.05)} className="space-y-2">
            {FAQ.map((f) => (
              <Faq key={f.q} {...f} />
            ))}
          </motion.ul>
        </motion.section>
      </motion.div>
    </>
  );
}
