import { motion } from 'framer-motion';
import { CalendarRange, ExternalLink, FileSpreadsheet, GraduationCap, Image, Printer } from 'lucide-react';
import DataGate from '../components/DataGate.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ListSkeleton } from '../components/Skeleton.jsx';
import { AKTU_RESULT_URL } from '../components/SideDrawer.jsx';
import { useShareCard } from '../hooks/useShareCard.js';
import { toast } from '../store/toastStore.js';
import { exportRecordsCsv, exportSubjectsCsv } from '../utils/exportReport.js';
import { fadeUp, stagger } from '../utils/motion.js';

function Action({ icon: Icon, tone, title, description, onClick, href }) {
  const content = (
    <>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-bold">
          {title}
          {href && <ExternalLink className="h-3.5 w-3.5 text-subtle" aria-hidden="true" />}
        </span>
        <span className="mt-0.5 block text-sm text-muted">{description}</span>
      </span>
    </>
  );
  const cls = 'card flex w-full items-center gap-4 p-5 text-left';
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
          {content}
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : (
        <button type="button" onClick={onClick} className={cls}>
          {content}
        </button>
      )}
    </motion.div>
  );
}

function ReportsView({ data }) {
  const share = useShareCard();
  const done = (title) => toast({ title, description: 'Saved to your downloads.', tone: 'success', duration: 2500 });
  return (
    <motion.div initial="hidden" animate="show" variants={stagger(0.06)} className="grid gap-3 md:grid-cols-2">
      <Action
        icon={FileSpreadsheet}
        tone="bg-safe/10 text-safe-ink"
        title="Subject summary (CSV)"
        description="Present, total, %, skips left and classes needed for every subject."
        onClick={() => {
          exportSubjectsCsv(data);
          done('Subject summary exported');
        }}
      />
      <Action
        icon={CalendarRange}
        tone="bg-a2/10 text-a2"
        title="Daily log (CSV)"
        description={`Every class in the log (${data.records.length}), newest first, with present or absent.`}
        onClick={() => {
          exportRecordsCsv(data);
          done('Daily log exported');
        }}
      />
      <Action icon={Image} tone="bg-a3/10 text-a3" title="Attendance card (image)" description="A shareable picture with your first name and percentage." onClick={share} />
      <Action icon={Printer} tone="bg-a1/10 text-a1" title="Print or save as PDF" description="Prints the current page using your browser's print dialog." onClick={() => window.print()} />
      <Action
        icon={GraduationCap}
        tone="bg-warn/10 text-warn-ink"
        title="AKTU result"
        description="Opens the AKTU One View portal. Sign in there with your AKTU details."
        href={AKTU_RESULT_URL}
      />
      <p className="text-xs text-subtle md:col-span-2">Files are created on this device. Nothing is uploaded anywhere.</p>
    </motion.div>
  );
}

export default function Reports() {
  return (
    <>
      <PageHeader eyebrow="Your data" title="Reports & export" description="Keep a copy of your attendance or share how you're doing." />
      <DataGate skeleton={<ListSkeleton count={4} />}>{(data) => <ReportsView data={data} />}</DataGate>
    </>
  );
}
