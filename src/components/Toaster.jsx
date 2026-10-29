import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { useToastStore } from '../store/toastStore.js';

const TONES = {
  info: { icon: Info, cls: 'text-a3' },
  success: { icon: CheckCircle2, cls: 'text-safe-ink' },
  warn: { icon: TriangleAlert, cls: 'text-warn-ink' },
  error: { icon: XCircle, cls: 'text-danger-ink' },
};

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:left-auto md:right-6 md:top-auto md:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { icon: Icon, cls } = TONES[t.tone] ?? TONES.info;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass-strong pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl p-3.5 pr-2"
              role="status"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cls}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="grid h-7 w-7 place-items-center rounded-full text-subtle hover:bg-line/10 hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
