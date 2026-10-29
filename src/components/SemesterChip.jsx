import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, GraduationCap, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAttendanceStore, useSemesterLabel } from '../store/attendanceStore.js';
import { spring } from '../utils/motion.js';

/** Current-semester chip. Becomes a switcher when past semesters are supported (experimental). */
export default function SemesterChip({ className = '' }) {
  const label = useSemesterLabel();
  const { semesters, viewing, pastSupported, pastLoading, selectSemester } = useAttendanceStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const canSwitch = pastSupported !== false && semesters.length > 1;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!label) return null;
  const activeId = viewing ?? semesters[0]?.userId;

  const chip = (
    <>
      {pastLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <GraduationCap className="h-3.5 w-3.5 text-a2" aria-hidden="true" />}
      <span className="max-w-[46vw] truncate sm:max-w-none">{label}</span>
      {canSwitch && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />}
    </>
  );

  if (!canSwitch) {
    return <span className={`chip glass text-muted ${className}`}>{chip}</span>;
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Semester: ${label}. Change semester`}
        className={`chip glass hover:text-fg ${viewing ? 'text-warn-ink' : 'text-muted'}`}
      >
        {chip}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } }}
            transition={spring}
            className="glass-strong absolute left-0 top-9 z-50 w-72 rounded-2xl p-1.5"
          >
            {semesters.map((s, i) => (
              <li key={s.userId}>
                <button
                  type="button"
                  role="option"
                  aria-selected={s.userId === activeId}
                  onClick={() => {
                    setOpen(false);
                    selectSemester(s.userId);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-line/[0.06]"
                >
                  <span className="flex-1">
                    <span className="block font-medium">{s.batchName}</span>
                    <span className="text-xs text-subtle">
                      {i === 0 ? 'Current' : 'Past · experimental'}
                      {s.financialYear ? ` · ${s.financialYear}` : ''}
                    </span>
                  </span>
                  {s.userId === activeId && <Check className="h-4 w-4 text-a2" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
