import { AnimatePresence, motion } from 'framer-motion';
import { Bug, ChevronDown, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ATTENDANCE_TARGET, ENABLE_PAST_SEMESTERS, PROXY_HOST, SUPABASE_ANON_KEY } from '../config/env.js';
import { useAttendanceStore } from '../store/attendanceStore.js';
import { useAuthStore } from '../store/authStore.js';
import { useDebugStore } from '../store/debugStore.js';

const mask = (v) => (v ? `${'•'.repeat(6)} (${v.length} chars)` : '(empty)');

const check = (a, b) => (a === b ? `✓ matches ERP ${b}` : `✗ ERP says ${b}`);

/** Day-wise log counts: regular + extra = sum, checked against the ERP's own totals. */
function logRows(data) {
  if (!data) return [['Day-wise log', '—']];
  const s = data.logStats;
  if (!s) return [['Day-wise log', `${data.records.length} records (refresh for the regular / extra split)`]];
  return [
    ['Log: regular', String(s.regular)],
    ['Log: extra', String(s.extra)],
    ['Log: sum', `${s.regular} + ${s.extra} = ${s.total} · ${check(s.total, data.overall.total)}`],
    ['Log: absent', `${s.absent} · ${check(s.absent, data.overall.absent)}`],
    ['Log: present', `${s.present} · ${check(s.present, data.overall.present)}`],
    ...(s.undated ? [['Log: undated', `${s.undated} records had no readable date and are not on the calendar`]] : []),
  ];
}

/** Developer panel, enabled with ?debug=1. Never shows tokens, passwords or personal data. */
export default function DebugPanel() {
  const { enabled, requests, clear } = useDebugStore();
  const sess = useAuthStore((s) => s.session);
  const att = useAttendanceStore();
  const [open, setOpen] = useState(false);
  if (!enabled) return null;

  const rows = [
    ['Proxy host', PROXY_HOST],
    ['Anon key', mask(SUPABASE_ANON_KEY)],
    ['Target', `${ATTENDANCE_TARGET}%`],
    ['Past semesters flag', `${ENABLE_PAST_SEMESTERS} → ${String(att.pastSupported)}`],
    ['Session', sess ? `present · expires ${new Date(sess.expiresAt).toLocaleString()}` : 'none'],
    ['Access token', sess ? mask(sess.accessToken) : '—'],
    ['Data status', `${att.status}${att.refreshing ? ' (refreshing)' : ''}${att.offline ? ' · offline' : ''}`],
    ['Subjects', att.data ? String(att.data.subjects.length) : '—'],
    ...logRows(att.data),
    ['Last error', att.error ? `${att.error.code}: ${att.error.detail || att.error.message}` : '—'],
  ];

  return (
    <div className="fixed bottom-24 left-3 z-[70] w-[min(92vw,420px)] md:bottom-4">
      <div className="glass-strong overflow-hidden rounded-2xl text-xs">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 px-3 py-2 font-semibold"
        >
          <Bug className="h-4 w-4 text-a3" aria-hidden="true" /> Developer debug
          <span className="ml-auto text-subtle">{requests.length} requests</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="max-h-[55vh] space-y-3 overflow-y-auto border-t border-line/10 p-3">
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  {rows.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-subtle">{k}</dt>
                      <dd className="break-all font-mono">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Requests (values hidden, shape only)</p>
                  <button type="button" onClick={clear} className="flex items-center gap-1 text-subtle hover:text-fg">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Clear
                  </button>
                </div>
                {requests.length === 0 && <p className="text-subtle">No proxy requests yet.</p>}
                {requests.map((r) => (
                  <details key={r.id} className="rounded-xl bg-line/[0.04] p-2">
                    <summary className="cursor-pointer font-mono">
                      <span className={r.status >= 200 && r.status < 300 ? 'text-safe-ink' : 'text-danger-ink'}>{r.status || r.error}</span>{' '}
                      {r.method} {r.endpoint} · {r.ms}ms
                    </summary>
                    {r.shape && <pre className="mt-2 overflow-x-auto font-mono text-[10px] text-muted">{JSON.stringify(r.shape, null, 1)}</pre>}
                  </details>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
