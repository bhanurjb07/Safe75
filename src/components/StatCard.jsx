import { motion } from 'framer-motion';
import CountUp from './CountUp.jsx';
import { fadeUp, spring } from '../utils/motion.js';

/** Small glass card with an icon, a counting number and a caption. */
export default function StatCard({ icon: Icon, label, value, decimals = 0, suffix = '', hint, tone = 'a1', delay = 0 }) {
  const tones = {
    a1: 'from-a1/25 to-a1/0 text-a1',
    a2: 'from-a2/25 to-a2/0 text-a2',
    a3: 'from-a3/25 to-a3/0 text-a3',
    safe: 'from-safe/25 to-safe/0 text-safe-ink',
    danger: 'from-danger/25 to-danger/0 text-danger-ink',
    warn: 'from-warn/25 to-warn/0 text-warn-ink',
  };
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3 }} transition={spring} className="card card-pad group overflow-hidden">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${tones[tone]}`}
      />
      <div className={`relative mb-4 inline-grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${tones[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="eyebrow relative">{label}</p>
      <p className="relative mt-1 text-3xl font-extrabold tracking-tight">
        <CountUp value={value} decimals={decimals} suffix={suffix} delay={delay} />
      </p>
      {hint && <p className="relative mt-1 text-xs text-muted">{hint}</p>}
    </motion.div>
  );
}
