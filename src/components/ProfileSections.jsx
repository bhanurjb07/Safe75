import { AnimatePresence, motion } from 'framer-motion';
import {
  BedDouble,
  BookOpen,
  Briefcase,
  Bus,
  Check,
  CircleAlert,
  Copy,
  Eye,
  EyeOff,
  GraduationCap,
  Home,
  IdCard,
  Info,
  MapPin,
  Phone,
  School,
  ScrollText,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from '../store/toastStore.js';
import { EASE_OUT, fadeUp, stagger, tapOnly } from '../utils/motion.js';
import { cn } from '../utils/status.js';
import ProgressRing from './ProgressRing.jsx';

const ICONS = { UserRound, IdCard, Phone, MapPin, Home, Users, ShieldCheck, GraduationCap, School, ScrollText, BookOpen, Info, Bus, BedDouble, Briefcase };
const REVEAL_MS = 30_000;

/** Copies a value; the toast names the field, never the value. */
export function CopyButton({ value, label, className = '' }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      toast({ title: `${label} copied`, tone: 'success', duration: 1800 });
      setTimeout(() => setDone(false), 1500);
    } catch {
      toast({ title: `Couldn't copy ${label.toLowerCase()}`, tone: 'error' });
    }
  };
  return (
    <motion.button
      {...tapOnly}
      type="button"
      onClick={copy}
      aria-label={`Copy ${label.toLowerCase()}`}
      className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-line/[0.06] text-muted hover:bg-line/[0.1] hover:text-fg', className)}
    >
      {done ? <Check className="h-3.5 w-3.5 text-safe-ink" /> : <Copy className="h-3.5 w-3.5" />}
    </motion.button>
  );
}

/** A card of label / value pairs. Sensitive values stay masked until revealed (re-hides after 30 s). */
export function SectionCard({ section }) {
  const Icon = ICONS[section.icon] ?? Info;
  const hasSensitive = section.fields.some((f) => f.sensitive);
  const [revealed, setRevealed] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const toggle = () => {
    clearTimeout(timer.current);
    setRevealed((r) => {
      if (!r) timer.current = setTimeout(() => setRevealed(false), REVEAL_MS);
      return !r;
    });
  };

  return (
    <motion.section variants={fadeUp} className="card card-pad" aria-label={section.title}>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-a2/10 text-a2">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="flex-1 font-bold">{section.title}</h3>
        {hasSensitive && (
          <motion.button
            {...tapOnly}
            type="button"
            onClick={toggle}
            aria-pressed={revealed}
            className="flex items-center gap-1.5 rounded-xl bg-line/[0.06] px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-fg"
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
            {revealed ? 'Hide' : 'Show private'}
          </motion.button>
        )}
      </div>
      <dl className="grid gap-x-6 sm:grid-cols-2">
        {section.fields.map((f) => (
          <div key={f.label} className="flex items-start gap-2 border-t border-line/[0.06] py-2.5">
            <div className="min-w-0 flex-1">
              <dt className="text-xs text-muted">{f.label}</dt>
              <dd className="mt-0.5 break-words text-[15px] font-semibold">
                {f.sensitive && !revealed ? (
                  <span className="tracking-widest text-subtle" aria-label={`${f.label} hidden`}>
                    ••••••
                  </span>
                ) : (
                  <span className={f.type === 'phone' || f.type === 'score' ? 'tabular' : undefined}>{f.value}</span>
                )}
              </dd>
            </div>
            {f.copy && <CopyButton value={f.value} label={f.label} className="mt-1" />}
          </div>
        ))}
      </dl>
    </motion.section>
  );
}

/** 12th subject-wise marks: table plus a percentage bar per subject. */
export function TwelfthMarks({ rows }) {
  if (!rows.length) return null;
  return (
    <motion.section variants={fadeUp} className="card card-pad lg:col-span-2" aria-labelledby="twelfth-marks">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-a3/10 text-a3">
          <School className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 id="twelfth-marks" className="font-bold">
          12th subject-wise marks
        </h3>
      </div>
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-2 pr-3 font-semibold">Subject</th>
              <th className="px-3 py-2 text-right font-semibold">Scored</th>
              <th className="px-3 py-2 text-right font-semibold">Max</th>
              <th className="w-[40%] py-2 pl-3 font-semibold">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.subject} className="border-t border-line/[0.06]">
                <td className="py-2.5 pr-3 font-semibold">{r.subject}</td>
                <td className="px-3 py-2.5 text-right tabular">{r.scored ?? '—'}</td>
                <td className="px-3 py-2.5 text-right tabular text-muted">{r.max ?? '—'}</td>
                <td className="py-2.5 pl-3">
                  {r.percent != null ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/10" aria-hidden="true">
                        <motion.div
                          className="h-full rounded-full bg-accent-gradient"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, r.percent)}%` }}
                          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 + i * 0.06 }}
                        />
                      </div>
                      <span className="w-14 text-right font-semibold tabular">{r.percent}%</span>
                    </div>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

/** Internships / achievements: items have undocumented shapes, so each shows its readable fields. */
export function ListCard({ list }) {
  const Icon = list.id === 'internships' ? Briefcase : GraduationCap;
  return (
    <motion.section variants={fadeUp} className="card card-pad" aria-label={list.title}>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-safe/10 text-safe-ink">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="flex-1 font-bold">{list.title}</h3>
        <span className="chip bg-line/[0.06] text-muted">{list.items.length}</span>
      </div>
      <ol className="relative space-y-3 border-l-2 border-line/10 pl-4">
        {list.items.map((rows, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full bg-a2 ring-4 ring-bg" aria-hidden="true" />
            <dl className="rounded-2xl bg-line/[0.03] p-3 text-sm">
              {rows.map(([k, v]) => (
                <div key={k + v} className="flex gap-2 py-0.5">
                  {k && <dt className="w-32 shrink-0 text-muted">{k}</dt>}
                  <dd className="min-w-0 break-words font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </motion.section>
  );
}

/** Completion ring + the fixed checklist's missing items. */
export function CompletionCard({ completion }) {
  const status = completion.percent >= 80 ? 'safe' : completion.percent >= 50 ? 'borderline' : 'danger';
  return (
    <motion.section variants={fadeUp} className="card card-pad lg:col-span-2" aria-labelledby="completion-title">
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <ProgressRing value={completion.percent} status={status} size={112} stroke={10} showTarget={false} glow={false} label={`Profile ${completion.percent}% complete`}>
          <span className="text-2xl font-extrabold tabular">{completion.percent}%</span>
        </ProgressRing>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 id="completion-title" className="text-lg font-bold">
            Profile completion
          </h2>
          <p className="text-sm text-muted tabular">
            {completion.done} of {completion.total} key details are on record with your college.
          </p>
          {completion.missing.length > 0 ? (
            <>
              <ul className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {completion.missing.map((m) => (
                  <li key={m} className="chip border border-warn/30 bg-warn/10 text-warn-ink">
                    <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    {m}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-subtle">
                These are filled in by your college. To add or correct them, contact your college office or update them in the ERP portal.
              </p>
            </>
          ) : (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-semibold text-safe-ink sm:justify-start">
              <Check className="h-4 w-4" aria-hidden="true" /> All key details are on record.
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}

/** A tab's cards, or a calm empty state when the ERP sent nothing for it. */
export function TabPanel({ tab, view }) {
  const sections = view.sections.filter((s) => s.tab === tab);
  const showMarks = tab === 'academic' && view.twelfthSubjects.length > 0;
  const lists = tab === 'other' ? view.lists : [];
  if (!sections.length && !showMarks && !lists.length) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-line/15 px-6 py-12 text-center">
        <Info className="mb-3 h-7 w-7 text-muted" aria-hidden="true" />
        <p className="font-semibold">Nothing here yet</p>
        <p className="mt-1 max-w-xs text-sm text-muted">Your college ERP hasn&apos;t shared these details.</p>
      </div>
    );
  }
  return (
    <AnimatePresence mode="wait">
      <motion.div key={tab} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.12 } }} variants={stagger(0.06)} className="grid gap-5 lg:grid-cols-2">
        {sections.map((s) => (
          <SectionCard key={s.id} section={s} />
        ))}
        {showMarks && <TwelfthMarks rows={view.twelfthSubjects} />}
        {lists.map((l) => (
          <ListCard key={l.id} list={l} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
