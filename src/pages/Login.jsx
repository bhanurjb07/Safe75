import { AnimatePresence, motion, useAnimationControls, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, CalendarCheck2, Eye, EyeOff, Info, Loader2, Lock, ShieldCheck, TrendingUp, User, XCircle } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Aurora from '../components/Aurora.jsx';
import CountUp from '../components/CountUp.jsx';
import Logo from '../components/Logo.jsx';
import ProgressRing from '../components/ProgressRing.jsx';
import { ATTENDANCE_TARGET } from '../config/env.js';
import { useAuthStore } from '../store/authStore.js';
import { fadeUp, stagger, tapOnly } from '../utils/motion.js';

const FEATURES = [
  { icon: ShieldCheck, text: 'Know instantly if you are safe' },
  { icon: CalendarCheck2, text: 'See exactly how many classes you can skip' },
  { icon: TrendingUp, text: 'Plan ahead with a what-if calculator' },
];

/** Decorative preview of the dashboard that floats with the cursor. */
function HeroPreview({ px, py }) {
  const reduce = useReducedMotion();
  const x1 = useTransform(px, (v) => v * 18);
  const y1 = useTransform(py, (v) => v * 18);
  const x2 = useTransform(px, (v) => v * -26);
  const y2 = useTransform(py, (v) => v * -26);
  const rotX = useTransform(py, (v) => v * -6);
  const rotY = useTransform(px, (v) => v * 8);

  return (
    <div aria-hidden="true" className="relative mx-auto h-[360px] w-full max-w-[420px]" style={{ perspective: 1000 }}>
      <motion.div
        style={reduce ? undefined : { x: x1, y: y1, rotateX: rotX, rotateY: rotY }}
        className="card absolute inset-x-6 top-6 flex flex-col items-center gap-3 p-6"
      >
        <ProgressRing value={82.4} status="safe" size={170} stroke={13} delay={0.6}>
          <span className="text-3xl font-extrabold tracking-tight text-safe-ink">
            <CountUp value={82.4} decimals={1} suffix="%" delay={0.5} />
          </span>
          <span className="text-[11px] text-muted">overall</span>
        </ProgressRing>
        <p className="flex items-center gap-1.5 text-sm font-bold text-safe-ink">
          <ShieldCheck className="h-4 w-4" /> You&apos;re safe
        </p>
      </motion.div>
      <motion.div
        style={reduce ? undefined : { x: x2, y: y2 }}
        className="glass-strong absolute -left-2 top-0 animate-float rounded-2xl px-3.5 py-2.5 text-xs font-semibold"
      >
        <span className="text-safe-ink">Can skip 6</span> more classes
      </motion.div>
      <motion.div
        style={reduce ? undefined : { x: x2, y: y1 }}
        className="glass-strong absolute -right-2 bottom-10 rounded-2xl px-3.5 py-2.5 text-xs font-semibold [animation-delay:-4s] animate-float"
      >
        <p className="text-subtle">Weakest subject</p>
        <p className="mt-0.5 text-warn-ink">On the edge</p>
      </motion.div>
      <div className="absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border border-dashed border-line/10" />
    </div>
  );
}

function Field({ id, label, icon: Icon, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-muted">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login, loggingIn, error, notice, clearError, clearNotice } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const shake = useAnimationControls();
  const userId = useId();
  const pwId = useId();
  const errId = useId();

  // Parallax from the pointer position, -1..1, smoothed with a spring.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 60, damping: 20 });
  const py = useSpring(my, { stiffness: 60, damping: 20 });
  const parallax = {
    x1: useTransform(px, (v) => v * -30),
    y1: useTransform(py, (v) => v * -30),
    x2: useTransform(px, (v) => v * 40),
    y2: useTransform(py, (v) => v * 40),
  };

  useEffect(() => {
    document.title = 'Sign in · Safe75';
  }, []);

  useEffect(() => {
    if (error) shake.start({ x: [0, -10, 10, -7, 7, -3, 0], transition: { duration: 0.45 } });
  }, [error, shake]);

  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    mx.set((e.clientX / window.innerWidth) * 2 - 1);
    my.set((e.clientY / window.innerHeight) * 2 - 1);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loggingIn) return;
    const user = username.trim();
    const pw = password;
    // Clear the password from the form (and React state) right away.
    setPassword('');
    if (!user || !pw) {
      useAuthStore.setState({ error: { code: 'empty', message: 'Enter both your username and password.' } });
      return;
    }
    const ok = await login(user, pw);
    if (ok) navigate('/', { replace: true });
  };

  const noticeText =
    notice === 'expired' ? 'Your session expired. Please sign in again.' : notice === 'logout' ? 'You have been logged out. See you soon!' : null;

  return (
    <motion.main
      onPointerMove={onPointerMove}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)', transition: { duration: 0.35 } }}
      className="relative grid min-h-dvh overflow-x-clip lg:grid-cols-[1.1fr_1fr]"
    >
      <Aurora parallax={parallax} rain />

      {/* Hero */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={stagger(0.09, 0.1)}
        className="relative hidden flex-col justify-center px-10 py-12 lg:flex xl:px-20"
      >
        <motion.div variants={fadeUp}>
          <Logo size={40} />
        </motion.div>
        <motion.h1 variants={fadeUp} className="term-cursor mt-10 text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
          Stay safe above <span className="text-gradient">{ATTENDANCE_TARGET}%</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-4 max-w-md text-lg text-muted">
          Your college attendance, beautifully clear. Am I safe? How many can I skip? How many must I attend?
        </motion.p>
        <motion.ul variants={stagger(0.08)} className="mt-8 space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <motion.li key={text} variants={fadeUp} className="flex items-center gap-3 text-sm font-medium">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-a2/15 text-a2">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              {text}
            </motion.li>
          ))}
        </motion.ul>
        <motion.div variants={fadeUp} className="mt-10">
          <HeroPreview px={px} py={py} />
        </motion.div>
      </motion.section>

      {/* Form */}
      <section className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <motion.div initial="hidden" animate="show" variants={stagger(0.08, 0.15)} className="w-full max-w-md">
          <motion.div variants={fadeUp} className="mb-8 text-center lg:hidden">
            <Logo size={44} className="justify-center" />
            <h1 className="term-cursor mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Stay safe above <span className="text-gradient">{ATTENDANCE_TARGET}%</span>
            </h1>
            <p className="mt-2 text-sm text-muted">Your attendance, at a glance.</p>
          </motion.div>

          <motion.div variants={fadeUp}>
          <motion.div animate={shake} className="card bg-black/90 p-5 sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-a2/70 to-transparent"
            />
            <p className="mb-4 flex items-center gap-2 border-b border-a1/20 pb-3 font-mono text-xs text-subtle" aria-hidden="true">
              <span className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-a1" />
                <span className="h-2 w-2 rounded-full bg-a1/50" />
                <span className="h-2 w-2 rounded-full bg-a1/25" />
              </span>
              <span className="truncate">safe75@erp:~$ <span className="text-fg">login</span></span>
            </p>
            <h2 className="text-lg font-bold sm:text-xl">Sign in with your ERP account</h2>
            <p className="mt-1 text-sm text-muted">Use the same username and password as your college ERP.</p>

            <AnimatePresence>
              {noticeText && !error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p
                    role="status"
                    className={`mt-4 flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm ${notice === 'expired' ? 'bg-warn/10 text-warn-ink' : 'bg-a3/10 text-a3'}`}
                  >
                    <Info className="h-4 w-4 shrink-0" aria-hidden="true" /> {noticeText}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <Field id={userId} label="Username / Roll number" icon={User}>
                <input
                  id={userId}
                  className="input pl-11"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="text"
                  placeholder="Your ERP username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) clearError();
                    if (notice) clearNotice();
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errId : undefined}
                />
              </Field>
              <Field id={pwId} label="Password" icon={Lock}>
                <input
                  id={pwId}
                  type={showPw ? 'text' : 'password'}
                  className="input pl-11 pr-12"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) clearError();
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errId : undefined}
                />
                <motion.button
                  {...tapOnly}
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  aria-pressed={showPw}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-subtle hover:bg-line/5 hover:text-fg"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={showPw ? 'hide' : 'show'}
                      initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </Field>

              <AnimatePresence>
                {error && (
                  <motion.p
                    id={errId}
                    role="alert"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className="flex items-start gap-2 overflow-hidden rounded-2xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger-ink"
                  >
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {error.message}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loggingIn}
                whileHover={{ scale: loggingIn ? 1 : 1.015 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary group relative w-full overflow-hidden py-3.5 text-[15px] animate-gradient-x"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                <AnimatePresence mode="wait" initial={false}>
                  {loggingIn ? (
                    <motion.span key="l" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing in…
                    </motion.span>
                  ) : (
                    <motion.span key="s" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2">
                      Sign in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>
          </motion.div>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-5 flex items-start justify-center gap-2 px-4 text-center text-xs leading-relaxed text-subtle">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Your password is sent only to your college ERP and is never stored.
          </motion.p>
        </motion.div>
      </section>
    </motion.main>
  );
}
