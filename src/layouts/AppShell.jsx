import { AnimatePresence, motion, useTransform } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  CloudOff,
  LayoutDashboard,
  Lightbulb,
  Lock,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import Aurora from '../components/Aurora.jsx';
import Logo from '../components/Logo.jsx';
import SideDrawer, { initials } from '../components/SideDrawer.jsx';
import { useAlerts } from '../hooks/useAlerts.js';
import SemesterChip from '../components/SemesterChip.jsx';
import { ATTENDANCE_TARGET } from '../config/env.js';
import { usePullToRefresh } from '../hooks/usePullToRefresh.js';
import { useAttendanceStore, useSemesterLabel } from '../store/attendanceStore.js';
import { useAuthStore } from '../store/authStore.js';
import { formatUpdated } from '../utils/dates.js';
import { page, spring } from '../utils/motion.js';
import { cn } from '../utils/status.js';

export const NAV = [
  { to: '/', label: 'Home', title: 'Dashboard', icon: LayoutDashboard },
  { to: '/subjects', label: 'Subjects', title: 'Subjects', icon: BookOpen },
  { to: '/history', label: 'History', title: 'History', icon: CalendarDays },
  { to: '/planner', label: 'Planner', title: 'Planner', icon: SlidersHorizontal },
  { to: '/insights', label: 'Insights', title: 'Insights', icon: Lightbulb },
];

// Pages reached from the side drawer (not in the tab bar).
const EXTRA_TITLES = { '/profile': 'Profile', '/notifications': 'Notifications', '/reports': 'Reports & export', '/about': 'Contact & About' };

function HeaderActions({ onMenu }) {
  const navigate = useNavigate();
  const { unread } = useAlerts();
  const profile = useAuthStore((s) => s.profile);
  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/notifications')}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative grid h-10 w-10 place-items-center rounded-full glass text-muted hover:text-fg"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-bg"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={spring}
        onClick={onMenu}
        aria-haspopup="dialog"
        aria-label="Open menu"
        className="grid h-10 w-10 place-items-center rounded-full bg-accent-gradient text-sm font-bold text-white shadow-glow"
      >
        {initials(profile?.fullName)}
      </motion.button>
    </>
  );
}

function RefreshButton({ className = '' }) {
  const { refreshing, status, load } = useAttendanceStore();
  const busy = refreshing || status === 'loading';
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={() => load({ force: true })}
      disabled={busy}
      aria-label={busy ? 'Refreshing attendance' : 'Refresh attendance'}
      className={cn('grid h-10 w-10 place-items-center rounded-full glass text-muted hover:text-fg disabled:opacity-70', className)}
    >
      <RefreshCw className={cn('h-4 w-4', busy && 'animate-spin')} aria-hidden="true" />
    </motion.button>
  );
}

function UpdatedLabel() {
  const { lastUpdated, offline } = useAttendanceStore();
  if (!lastUpdated) return null;
  return (
    <span className={cn('hidden items-center gap-1.5 text-xs sm:inline-flex', offline ? 'text-warn-ink' : 'text-subtle')}>
      {offline && <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />}
      {offline ? 'Offline · ' : ''}Last updated {formatUpdated(lastUpdated)}
    </span>
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col p-4 lg:flex">
      <div className="glass flex h-full flex-col rounded-4xl p-4">
        <div className="px-2 pb-6 pt-2">
          <Logo />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className="relative">
              {({ isActive }) => (
                <motion.span
                  whileHover={{ x: 3 }}
                  transition={spring}
                  className={cn(
                    'relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                    isActive ? 'text-fg' : 'text-muted hover:text-fg',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      transition={spring}
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-a1/20 via-a2/10 to-transparent ring-1 ring-a2/25"
                    />
                  )}
                  <Icon className={cn('relative h-5 w-5', isActive && 'text-a2')} aria-hidden="true" />
                  <span className="relative">{label}</span>
                  {isActive && <span className="relative ml-auto h-1.5 w-1.5 rounded-full bg-a3 shadow-[0_0_10px_rgb(var(--a3))]" />}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-3xl bg-gradient-to-br from-a1/15 via-a2/10 to-a3/10 p-4 ring-1 ring-line/10">
            <p className="eyebrow">Your target</p>
            <p className="mt-1 text-2xl font-extrabold tabular">{ATTENDANCE_TARGET}%</p>
            <p className="mt-1 text-xs text-muted">Safe at {ATTENDANCE_TARGET + 5}%+, borderline in between.</p>
          </div>
          <p className="flex items-start gap-2 px-2 text-[11px] leading-relaxed text-subtle">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            Data stays in this tab and clears when you log out.
          </p>
        </div>
      </div>
    </aside>
  );
}

function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 px-3 pt-2 lg:hidden"
      style={{ background: 'linear-gradient(to top, rgb(var(--bg)) 40%, transparent)' }}
    >
      <div className="glass-strong mx-auto flex max-w-md items-stretch justify-between rounded-3xl p-1.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="relative flex-1">
            {({ isActive }) => (
              <motion.span
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[10.5px] font-semibold transition-colors',
                  isActive ? 'text-fg' : 'text-subtle',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-active"
                    transition={spring}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-b from-a2/25 to-a1/10 ring-1 ring-a2/30"
                  />
                )}
                <motion.span animate={isActive ? { y: -1, scale: 1.12 } : { y: 0, scale: 1 }} transition={spring} className="relative">
                  <Icon className={cn('h-5 w-5', isActive && 'text-a2')} aria-hidden="true" />
                </motion.span>
                <span className="relative">{label}</span>
              </motion.span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} variants={page} initial="initial" animate="enter" exit="exit">
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}

function PastSemesterBanner() {
  const viewing = useAttendanceStore((s) => s.viewing);
  const selectSemester = useAttendanceStore((s) => s.selectSemester);
  const label = useSemesterLabel();
  return (
    <AnimatePresence>
      {viewing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-warn/30 bg-warn/10 px-4 py-2.5 text-sm">
            <span className="flex-1">
              Viewing a past semester: <strong>{label}</strong>
            </span>
            <button type="button" onClick={() => selectSemester(null)} className="flex items-center gap-1 font-semibold text-warn-ink hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Current
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function AppShell() {
  const location = useLocation();
  const load = useAttendanceStore((s) => s.load);
  const checkExpiry = useAuthStore((s) => s.checkExpiry);
  const hasSession = useAuthStore((s) => Boolean(s.session));
  const { y: pullY, armed } = usePullToRefresh(() => load({ force: true }));
  const pullRotate = useTransform(pullY, [0, 120], [0, 300]);
  const pullOpacity = useTransform(pullY, [0, 40, 72], [0, 0.6, 1]);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const current =
    NAV.find((n) => (n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to))) ??
    (EXTRA_TITLES[location.pathname] ? { title: EXTRA_TITLES[location.pathname] } : undefined);

  const loadProfile = useAuthStore((s) => s.loadProfile);

  useEffect(() => {
    if (hasSession) load();
  }, [hasSession, load]);

  // The full profile lives in memory only, so fetch it on every login and page load.
  useEffect(() => {
    if (hasSession) loadProfile();
  }, [hasSession, loadProfile]);

  useEffect(() => {
    document.title = `${current?.title ?? 'Safe75'} · Safe75`;
    window.scrollTo({ top: 0 });
  }, [location.pathname, current]);

  // End the session once `.expires` passes, and re-check when the tab comes back.
  useEffect(() => {
    checkExpiry();
    const id = setInterval(checkExpiry, 30_000);
    const onVis = () => document.visibilityState === 'visible' && checkExpiry();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [checkExpiry]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(6px)', transition: { duration: 0.35 } }}
      className="min-h-dvh overflow-x-clip"
    >
      <Aurora />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-xl focus:bg-card focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Sidebar />

      {/* Pull-to-refresh indicator */}
      <motion.div
        aria-hidden="true"
        style={{ y: pullY, opacity: pullOpacity }}
        className="pointer-events-none fixed left-1/2 top-2 z-50 -ml-5 grid h-10 w-10 place-items-center rounded-full glass-strong lg:hidden"
      >
        <motion.span style={{ rotate: pullRotate }} className={armed ? 'text-a2' : 'text-muted'}>
          <RefreshCw className="h-4 w-4" />
        </motion.span>
      </motion.div>

      <div className="lg:pl-64">
        <header
          className={cn(
            'sticky top-0 z-30 transition-all duration-300',
            scrolled ? 'bg-bg/70 shadow-[0_1px_0_rgb(var(--line)/0.06)] backdrop-blur-xl' : 'bg-transparent',
          )}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:py-4">
            <div className="lg:hidden">
              <Logo size={32} showText={false} />
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={current?.title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="hidden text-sm font-semibold text-muted lg:block"
              >
                {current?.title}
              </motion.p>
            </AnimatePresence>
            <SemesterChip className="min-w-0" />
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <UpdatedLabel />
              <RefreshButton />
              <HeaderActions onMenu={() => setMenuOpen(true)} />
            </div>
          </div>
        </header>

        <motion.main id="main" style={{ y: pullY }} className="mx-auto max-w-6xl px-4 pb-32 pt-2 sm:px-6 lg:pb-12">
          <PastSemesterBanner />
          <AnimatedOutlet />
          <footer className="mt-12 border-t border-line/10 pt-5 text-center text-xs leading-relaxed text-subtle">
            <p className="flex items-center justify-center gap-1.5">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Your password goes only to your college ERP and is never stored. Your attendance and details stay in this tab only;
              contact details are never saved at all.
            </p>
            <p className="mt-1">Unofficial tool · not affiliated with your college.</p>
          </footer>
        </motion.main>
      </div>
      <TabBar />
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </motion.div>
  );
}
