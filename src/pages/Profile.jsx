import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Eye, EyeOff, GraduationCap, Hash, IdCard, Info, Lock, MapPin, Phone, RefreshCw, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { initials } from '../components/SideDrawer.jsx';
import { useSemesterLabel } from '../store/attendanceStore.js';
import { useAuthStore } from '../store/authStore.js';
import { useProfileStore } from '../store/profileStore.js';
import { toast } from '../store/toastStore.js';
import { fadeUp, stagger, tapOnly } from '../utils/motion.js';
import { cn } from '../utils/status.js';

const REMASK_MS = 10_000;

const maskAadhaar = (d) => `•••• •••• ${d.slice(-4)}`;
const groupAadhaar = (d) => d.replace(/(\d{4})(?=\d)/g, '$1 ');

/** Copies a value. The toast names the field, never the value itself. */
function CopyButton({ value, label }) {
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
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-line/[0.06] text-muted hover:bg-line/[0.1] hover:text-fg"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={done ? 'y' : 'n'} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
          {done ? <Check className="h-4 w-4 text-safe-ink" /> : <Copy className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

function Row({ icon: Icon, tone, label, children, actions }) {
  return (
    <motion.div variants={fadeUp} className="flex items-start gap-3 py-3.5">
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl', tone)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow">{label}</p>
        <div className="mt-0.5 break-words text-[15px] font-semibold">{children}</div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </motion.div>
  );
}

const Missing = () => <span className="font-normal text-subtle">Not provided by the ERP</span>;

/** Aadhaar, masked to the last 4 digits; reveal re-masks after 10 s or when leaving the page. */
function AadhaarValue({ digits }) {
  const [shown, setShown] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const toggle = () => {
    clearTimeout(timer.current);
    setShown((s) => {
      if (!s) timer.current = setTimeout(() => setShown(false), REMASK_MS);
      return !s;
    });
  };

  return (
    <Row
      icon={IdCard}
      tone="bg-a1/10 text-a1"
      label="Aadhaar number"
      actions={
        <>
          <motion.button
            {...tapOnly}
            type="button"
            onClick={toggle}
            aria-pressed={shown}
            aria-label={shown ? 'Hide Aadhaar number' : 'Show Aadhaar number for 10 seconds'}
            className="grid h-9 w-9 place-items-center rounded-xl bg-line/[0.06] text-muted hover:bg-line/[0.1] hover:text-fg"
          >
            {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </motion.button>
          <CopyButton value={digits} label="Aadhaar number" />
        </>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={shown ? 'full' : 'masked'}
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.2 }}
          className="inline-block font-mono tracking-wider tabular"
        >
          {shown ? groupAadhaar(digits) : maskAadhaar(digits)}
        </motion.span>
      </AnimatePresence>
      {shown && (
        <motion.span
          className="mt-1.5 block h-0.5 origin-left rounded-full bg-a1/60"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: REMASK_MS / 1000, ease: 'linear' }}
          aria-hidden="true"
        />
      )}
    </Row>
  );
}

export default function Profile() {
  const basic = useAuthStore((s) => s.profile);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const { details, status, error } = useProfileStore();
  const semester = useSemesterLabel();

  const fullName = details ? [details.firstName, details.middleName, details.lastName].filter(Boolean).join(' ') : basic?.fullName;
  const roll = details?.rollNumber || basic?.rollNumber;

  return (
    <>
      <PageHeader eyebrow="You" title="Profile" />
      <motion.div initial="hidden" animate="show" variants={stagger(0.08)} className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Identity */}
        <motion.section variants={fadeUp} className="card overflow-hidden">
          <div className="relative bg-accent-gradient px-6 pb-6 pt-7 text-white">
            <div aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="relative grid h-20 w-20 place-items-center rounded-full bg-white text-4xl font-extrabold text-a1 shadow-xl"
            >
              {initials(fullName)}
            </motion.div>
            <p className="relative mt-4 text-xl font-extrabold uppercase leading-tight tracking-wide">{fullName || 'Student'}</p>
            {roll && <p className="relative mt-1 font-mono text-sm text-white/85">{roll}</p>}
          </div>
          <div className="divide-y divide-line/[0.07] px-5">
            <Row icon={Hash} tone="bg-a2/10 text-a2" label="Roll number">
              {roll || <Missing />}
            </Row>
            <Row icon={UserRound} tone="bg-a3/10 text-a3" label="Admission number">
              {details ? details.admissionNumber || <Missing /> : <Skeleton className="mt-1 h-4 w-32" />}
            </Row>
            <Row icon={GraduationCap} tone="bg-warn/10 text-warn-ink" label="Semester">
              {semester || <Missing />}
            </Row>
          </div>
        </motion.section>

        {/* Contact details: memory only */}
        <motion.section variants={fadeUp} className="card card-pad" aria-labelledby="contact-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="contact-title" className="text-lg font-bold">
                Contact details
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                This is pulled directly from your college ERP profile.
              </p>
            </div>
          </div>

          {status === 'error' && !details ? (
            <div role="alert" className="mt-5 rounded-2xl bg-danger/10 p-4 text-sm">
              <p className="font-semibold text-danger-ink">Couldn&apos;t load your profile</p>
              <p className="mt-1 text-muted">{error?.message}</p>
              <button type="button" onClick={loadProfile} className="btn-ghost mt-3">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
              </button>
            </div>
          ) : !details ? (
            <div className="mt-4 space-y-5" aria-label="Loading contact details" role="status">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div variants={stagger(0.06, 0.1)} initial="hidden" animate="show" className="mt-2 divide-y divide-line/[0.07]">
              <Row icon={Phone} tone="bg-safe/10 text-safe-ink" label="Mobile number" actions={details.mobile && <CopyButton value={details.mobile} label="Mobile number" />}>
                {details.mobile ? <span className="tabular">{details.mobile}</span> : <Missing />}
              </Row>
              <Row icon={MapPin} tone="bg-danger/10 text-danger-ink" label="Address">
                {details.address || <Missing />}
              </Row>
              {details.aadhaar ? (
                <AadhaarValue digits={details.aadhaar} />
              ) : (
                <Row icon={IdCard} tone="bg-a1/10 text-a1" label="Aadhaar number">
                  <Missing />
                </Row>
              )}
            </motion.div>
          )}
        </motion.section>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex items-start justify-center gap-2 text-center text-xs text-subtle"
      >
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Your contact details are shown only to you in this browser session and are not stored or sent anywhere else.
      </motion.p>
    </>
  );
}
