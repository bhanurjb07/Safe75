import { motion } from 'framer-motion';
import { BellOff, CalendarX2, ShieldAlert, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DataGate from '../components/DataGate.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ListSkeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/States.jsx';
import { useAlerts } from '../hooks/useAlerts.js';
import { formatLongDay } from '../utils/dates.js';
import { fadeUp, stagger } from '../utils/motion.js';
import { cn } from '../utils/status.js';

const TONES = {
  danger: { icon: ShieldAlert, cls: 'bg-danger/10 text-danger-ink', ring: 'border-danger/20' },
  warn: { icon: TriangleAlert, cls: 'bg-warn/10 text-warn-ink', ring: 'border-warn/20' },
  info: { icon: CalendarX2, cls: 'bg-a2/10 text-a2', ring: 'border-line/10' },
};

function NotificationsView() {
  const { alerts: live, markRead } = useAlerts();
  // Keep what was shown on arrival (with its "New" tags) while marking everything read in the background.
  const [alerts] = useState(live);
  const markRef = useRef(markRead);
  markRef.current = markRead;

  useEffect(() => {
    const t = setTimeout(() => markRef.current(), 800);
    return () => clearTimeout(t);
  }, []);

  const subjectAlerts = alerts.filter((a) => a.tone !== 'info');
  const absenceAlerts = alerts.filter((a) => a.tone === 'info');

  const Card = ({ a }) => {
    const t = TONES[a.tone];
    const Icon = t.icon;
    const body = (
      <>
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', t.cls)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-semibold">{a.title}</span>
            {a.isNew && <span className="chip bg-a3/15 px-2 py-0.5 text-[10px] uppercase text-a3">New</span>}
          </span>
          {a.date && <span className="block text-xs text-subtle">{formatLongDay(a.date)}</span>}
          <span className="mt-0.5 block text-sm text-muted">{a.body}</span>
        </span>
      </>
    );
    return (
      <motion.li variants={fadeUp}>
        {a.subjectId ? (
          <Link to={`/subjects?open=${encodeURIComponent(a.subjectId)}`} className={cn('card flex items-start gap-3 border p-4 transition-colors hover:bg-line/[0.04]', t.ring)}>
            {body}
          </Link>
        ) : (
          <div className={cn('card flex items-start gap-3 border p-4', t.ring)}>{body}</div>
        )}
      </motion.li>
    );
  };

  if (!alerts.length) {
    return <EmptyState icon={BellOff} title="All quiet" message="No low-attendance warnings and no recent absences. Keep it up!" />;
  }

  return (
    <motion.div initial="hidden" animate="show" variants={stagger(0.05)} className="space-y-6">
      {subjectAlerts.length > 0 && (
        <section>
          <h2 className="eyebrow mb-2">Needs attention</h2>
          <motion.ul variants={stagger(0.05)} className="space-y-2.5">
            {subjectAlerts.map((a) => (
              <Card key={a.id} a={a} />
            ))}
          </motion.ul>
        </section>
      )}
      {absenceAlerts.length > 0 && (
        <section>
          <h2 className="eyebrow mb-2">Recent absences</h2>
          <motion.ul variants={stagger(0.05)} className="space-y-2.5">
            {absenceAlerts.map((a) => (
              <Card key={a.id} a={a} />
            ))}
          </motion.ul>
        </section>
      )}
    </motion.div>
  );
}

export default function Notifications() {
  return (
    <>
      <PageHeader eyebrow="Alerts" title="Notifications" description="Built from your own attendance: subjects in danger and days you were marked absent." />
      <DataGate skeleton={<ListSkeleton count={4} />}>{() => <NotificationsView />}</DataGate>
    </>
  );
}
