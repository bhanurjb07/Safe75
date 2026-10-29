import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { ArrowDownUp, FlaskConical, LayoutGrid, Search, SearchX, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataGate from '../components/DataGate.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Segmented from '../components/Segmented.jsx';
import SubjectCard from '../components/SubjectCard.jsx';
import SubjectDetail from '../components/SubjectDetail.jsx';
import { ListSkeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/States.jsx';
import { subjectsWithStats } from '../utils/analytics.js';
import { stagger } from '../utils/motion.js';

const FILTERS = [
  { value: 'all', label: 'All', icon: LayoutGrid },
  { value: 'safe', label: 'Safe', icon: ShieldCheck },
  { value: 'danger', label: 'Danger', icon: ShieldAlert },
  { value: 'labs', label: 'Labs', icon: FlaskConical },
];

const SORTS = {
  risk: { label: 'Risk (lowest first)', fn: (a, b) => a.percentage - b.percentage || a.name.localeCompare(b.name) },
  name: { label: 'Name (A–Z)', fn: (a, b) => a.name.localeCompare(b.name) },
  percentage: { label: 'Percentage (highest)', fn: (a, b) => b.percentage - a.percentage || a.name.localeCompare(b.name) },
};

function SubjectsView({ data }) {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('risk');
  const subjects = useMemo(() => subjectsWithStats(data.subjects), [data.subjects]);
  const openId = params.get('open');
  const selected = subjects.find((s) => s.id === openId) ?? null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subjects
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      .filter((s) => {
        if (filter === 'safe') return s.status !== 'danger';
        if (filter === 'danger') return s.status === 'danger';
        if (filter === 'labs') return s.isLab;
        return true;
      })
      .sort(SORTS[sort].fn);
  }, [subjects, query, filter, sort]);

  const open = (s) => setParams(s ? { open: s.id } : {}, { replace: false });
  const close = () => setParams({}, { replace: true });

  return (
    <>
      <PageHeader
        eyebrow={`${subjects.length} subjects`}
        title="Subjects"
        description="Tap any subject for its absent dates, trend and what-if calculator."
      />

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <input
            type="search"
            className="input glass pl-11 pr-10"
            placeholder="Search by name or code"
            aria-label="Search subjects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-subtle hover:bg-line/10"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Filter subjects" options={FILTERS} value={filter} onChange={setFilter} className="glass" />
          <label className="glass relative flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-muted">
            <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="cursor-pointer appearance-none bg-transparent pr-1 text-fg outline-none [&>option]:bg-card"
            >
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <LayoutGroup>
        {visible.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nothing matches"
            message="Try a different search or filter."
            action={
              <button
                type="button"
                className="btn-ghost mt-4"
                onClick={() => {
                  setQuery('');
                  setFilter('all');
                }}
              >
                Reset filters
              </button>
            }
          />
        ) : (
          <motion.div initial="hidden" animate="show" variants={stagger(0.05)} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((s) => (
                <SubjectCard key={s.id} subject={s} onOpen={open} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        <SubjectDetail subject={selected} records={data.records} onClose={close} />
      </LayoutGroup>
    </>
  );
}

export default function Subjects() {
  return (
    <DataGate
      skeleton={
        <>
          <PageHeader title="Subjects" />
          <ListSkeleton count={9} />
        </>
      }
    >
      {(data) => <SubjectsView data={data} />}
    </DataGate>
  );
}
