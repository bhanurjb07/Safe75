import { motion } from 'framer-motion';
import { CloudOff, Inbox, RefreshCw, ServerCrash, TriangleAlert, WifiOff } from 'lucide-react';
import { fadeUp, tapOnly } from '../utils/motion.js';

const ICONS = { network: WifiOff, timeout: CloudOff, server: ServerCrash };

/** Friendly error card with a retry button. */
export function ErrorState({ error, onRetry, title = "Couldn't load your attendance" }) {
  const Icon = ICONS[error?.code] ?? TriangleAlert;
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      role="alert"
      className="card card-pad mx-auto flex max-w-md flex-col items-center py-10 text-center"
    >
      <motion.div
        initial={{ rotate: -8, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-danger/10 text-danger-ink"
      >
        <Icon className="h-8 w-8" aria-hidden="true" />
      </motion.div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1.5 text-sm text-muted">{error?.message ?? 'Something went wrong.'}</p>
      {onRetry && (
        <motion.button {...tapOnly} type="button" onClick={onRetry} className="btn-primary mt-6">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </motion.button>
      )}
    </motion.div>
  );
}

/** Empty list / nothing-matches state. */
export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className="flex flex-col items-center rounded-3xl border border-dashed border-line/15 px-6 py-12 text-center"
    >
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-line/5 text-muted">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="font-semibold">{title}</p>
      {message && <p className="mt-1 max-w-xs text-sm text-muted">{message}</p>}
      {action}
    </motion.div>
  );
}
