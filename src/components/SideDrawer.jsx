import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronRight,
  ExternalLink,
  FileDown,
  GraduationCap,
  Info,
  LogOut,
  Share2,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useShareCard } from '../hooks/useShareCard.js';
import { useAlerts } from '../hooks/useAlerts.js';
import { useAttendanceStore, useSemesterLabel } from '../store/attendanceStore.js';
import { useAuthStore } from '../store/authStore.js';
import { fadeUp, spring, stagger } from '../utils/motion.js';
import { cn } from '../utils/status.js';

export const AKTU_RESULT_URL = 'https://erp.aktu.ac.in/';

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 1)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'S';

function Item({ icon: Icon, label, hint, badge, tone = 'text-a2', onClick, href, danger }) {
  const inner = (
    <>
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl', danger ? 'bg-danger/10 text-danger-ink' : `bg-line/[0.05] ${tone}`)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-semibold">
          {label}
          {badge}
        </span>
        {hint && <span className="block truncate text-xs text-muted">{hint}</span>}
      </span>
      {href ? (
        <ExternalLink className="h-4 w-4 text-subtle" aria-hidden="true" />
      ) : (
        !danger && <ChevronRight className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      )}
    </>
  );
  const cls = cn(
    'group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[15px] transition-colors',
    danger ? 'text-danger-ink hover:bg-danger/10' : 'hover:bg-line/[0.06]',
  );
  return (
    <motion.li variants={fadeUp}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>
          {inner}
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : (
        <button type="button" className={cls} onClick={onClick}>
          {inner}
        </button>
      )}
    </motion.li>
  );
}

/** Slide-in menu with the student's name, roll number, semester and app sections. */
export default function SideDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const { profile, logout } = useAuthStore();
  const semester = useSemesterLabel();
  const hasData = useAttendanceStore((s) => Boolean(s.data));
  const share = useShareCard();
  const { unread } = useAlerts();
  const name = profile?.fullName ?? 'Student';

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => panelRef.current?.focus(), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  const go = (to) => {
    onClose();
    navigate(to);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[55]">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            initial={{ x: '105%' }}
            animate={{ x: 0 }}
            exit={{ x: '105%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.6 }}
            onDragEnd={(_, info) => (info.offset.x > 90 || info.velocity.x > 500) && onClose()}
            className="glass-strong absolute inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col overflow-hidden rounded-l-4xl outline-none"
          >
            {/* Profile header */}
            <div className="relative overflow-hidden bg-accent-gradient px-5 pb-6 pt-[max(env(safe-area-inset-top),1.25rem)] text-white">
              <div aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
              <div aria-hidden="true" className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-a3/40 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...spring, delay: 0.1 }}
                  className="grid h-20 w-20 place-items-center rounded-full bg-white text-4xl font-extrabold text-a1 shadow-xl"
                >
                  {initials(name)}
                </motion.div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/15 hover:bg-white/25"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="relative mt-4">
                <p className="text-lg font-extrabold uppercase leading-tight tracking-wide">{name}</p>
                {profile?.rollNumber && <p className="mt-1 font-mono text-sm text-white/85">{profile.rollNumber}</p>}
                {semester && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> {semester}
                  </p>
                )}
              </motion.div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              <motion.ul initial="hidden" animate="show" variants={stagger(0.04, 0.12)} className="space-y-1">
                <Item icon={UserRound} label="Profile" hint="Your details and contact info" tone="text-a1" onClick={() => go('/profile')} />
                <Item
                  icon={Bell}
                  label="Notifications"
                  hint="Alerts about low attendance and new absences"
                  tone="text-danger-ink"
                  badge={unread > 0 && <span className="chip bg-danger px-2 py-0.5 text-[11px] text-white">{unread}</span>}
                  onClick={() => go('/notifications')}
                />
                <Item
                  icon={GraduationCap}
                  label="AKTU Result"
                  hint="Opens the AKTU One View portal"
                  tone="text-warn-ink"
                  href={AKTU_RESULT_URL}
                  onClick={onClose}
                />
                <Item icon={FileDown} label="Reports & export" hint="Download your attendance as CSV" tone="text-a3" onClick={() => go('/reports')} />
                <Item
                  icon={Share2}
                  label="Share attendance card"
                  hint="An image with your first name and %"
                  tone="text-a1"
                  onClick={() => {
                    onClose();
                    if (hasData) share();
                  }}
                />
                <Item icon={Info} label="Contact & About" hint="How Safe75 works, privacy, FAQ" tone="text-a2" onClick={() => go('/about')} />
              </motion.ul>

              <p className="mt-6 px-3 font-mono text-[11px] text-subtle" aria-hidden="true">
                [ session: active ] <span className="animate-blink">█</span>
              </p>
            </div>

            <div className="safe-bottom border-t border-line/10 px-3 pt-2">
              <ul>
                <Item icon={LogOut} label="Sign out" danger onClick={() => logout('logout')} />
              </ul>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
