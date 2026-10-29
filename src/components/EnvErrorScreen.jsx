import { motion } from 'framer-motion';
import { FileWarning } from 'lucide-react';
import Aurora from './Aurora.jsx';
import Logo from './Logo.jsx';
import { fadeUp, stagger } from '../utils/motion.js';

/** Shown at startup when required .env variables are missing. */
export default function EnvErrorScreen({ missing }) {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <Aurora />
      <motion.div initial="hidden" animate="show" variants={stagger(0.08)} className="card card-pad w-full max-w-lg">
        <motion.div variants={fadeUp}>
          <Logo />
        </motion.div>
        <motion.div variants={fadeUp} className="mt-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-warn/10 text-warn-ink">
            <FileWarning className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Setup needed</h1>
            <p className="text-sm text-muted">Safe75 can't reach your ERP without these settings.</p>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="mt-5 rounded-2xl bg-line/[0.04] p-4">
          <p className="text-sm font-medium">
            Missing in <code className="font-mono text-a3">.env</code>:
          </p>
          <ul className="mt-2 space-y-1">
            {missing.map((m) => (
              <li key={m} className="font-mono text-sm text-danger-ink">
                {m}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Copy <code className="font-mono">.env.example</code> to <code className="font-mono">.env</code>, fill in the values, then
            restart <code className="font-mono">npm run dev</code>.
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
