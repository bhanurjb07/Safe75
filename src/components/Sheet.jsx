import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useIsDesktop } from '../hooks/useMediaQuery.js';
import { EASE_OUT, tapOnly } from '../utils/motion.js';

/**
 * Modal: a bottom sheet on phones (drag the handle down to close), a centered dialog on desktop.
 * Pass `layoutId` to morph from the element that opened it.
 */
export default function Sheet({ open, onClose, title, subtitle, layoutId, children, size = 'md' }) {
  const desktop = useIsDesktop();
  const titleId = useId();
  const panelRef = useRef(null);
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panelRef.current) {
        // Keep focus inside the dialog.
        const f = panelRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => panelRef.current?.focus(), 60);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  const widths = { sm: 'md:max-w-md', md: 'md:max-w-2xl', lg: 'md:max-w-3xl' };
  const motionProps = layoutId
    ? { layoutId, initial: { opacity: 0.6 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : desktop
      ? { initial: { opacity: 0, scale: 0.95, y: 16 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, y: 8 } }
      : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center md:items-center md:p-6">
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              {...motionProps}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              drag={desktop ? false : 'y'}
              dragControls={drag}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 110 || info.velocity.y > 600) onClose();
              }}
              className={`glass-strong pointer-events-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-4xl outline-none md:rounded-4xl ${widths[size]}`}
            >
              <div
                className="shrink-0 cursor-grab touch-none px-5 pt-3 active:cursor-grabbing md:cursor-default md:pt-5"
                onPointerDown={(e) => !desktop && drag.start(e)}
              >
                <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-line/20 md:hidden" aria-hidden="true" />
                <div className="flex items-start justify-between gap-4">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, ease: EASE_OUT }}>
                    <h2 id={titleId} className="text-lg font-bold leading-tight md:text-xl">
                      {title}
                    </h2>
                    {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
                  </motion.div>
                  <motion.button
                    {...tapOnly}
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-line/[0.07] text-muted hover:text-fg"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
              <motion.div
                className="safe-bottom overflow-y-auto overscroll-contain px-5 pb-6 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                {children}
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
