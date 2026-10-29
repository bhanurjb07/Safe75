import { motion } from 'framer-motion';
import { cn } from '../utils/status.js';

/**
 * One P / A badge per class, in order (regular first, then extra), e.g. "P A A".
 * Extra lectures get a dashed outline.
 */
export default function AttendanceMarks({ records, size = 'md', delay = 0 }) {
  const absent = records.filter((r) => r.isAbsent).length;
  const extra = records.filter((r) => r.isExtra).length;
  const label = `${records.length} ${records.length === 1 ? 'class' : 'classes'}${extra ? ` (${extra} extra)` : ''}: ${records.length - absent} present, ${absent} absent`;
  return (
    <span className="flex shrink-0 flex-wrap justify-end gap-1.5" role="img" aria-label={label}>
      {records.map((r, i) => (
        <motion.span
          key={r.id}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 24, delay: delay + i * 0.05 }}
          className={cn(
            'grid place-items-center rounded-xl font-extrabold',
            size === 'sm' ? 'h-7 w-7 text-sm' : 'h-9 w-9 text-lg',
            r.isAbsent ? 'bg-danger/10 text-danger-ink' : 'bg-safe/10 text-safe-ink',
            r.isExtra
              ? cn('border-[1.5px] border-dashed', r.isAbsent ? 'border-danger/60' : 'border-safe/60')
              : cn('ring-1', r.isAbsent ? 'ring-danger/25' : 'ring-safe/25'),
          )}
          title={`${r.isExtra ? 'Extra lecture' : 'Class'}: ${r.isAbsent ? 'absent' : 'present'}`}
          aria-hidden="true"
        >
          {r.isAbsent ? 'A' : 'P'}
        </motion.span>
      ))}
    </span>
  );
}

/** "2 classes · 1 extra", "Extra lecture", "Lecture"… for a row's subtitle. */
export function classesLabel(records) {
  const extra = records.filter((r) => r.isExtra).length;
  if (records.length === 1) return records[0].kind ?? '1 class';
  return `${records.length} classes${extra ? ` · ${extra} extra` : ''}`;
}

/** Groups records into [key, records[]] pairs, keeping the incoming order. */
export function groupBy(records, keyFn) {
  const map = new Map();
  for (const r of records) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return [...map];
}
