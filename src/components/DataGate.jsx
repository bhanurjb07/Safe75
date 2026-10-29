import { useActiveData, useAttendanceStore } from '../store/attendanceStore.js';
import { DashboardSkeleton } from './Skeleton.jsx';
import { ErrorState } from './States.jsx';

/** Renders skeleton → error → children(data), so no page ever shows a blank screen. */
export default function DataGate({ skeleton, children }) {
  const data = useActiveData();
  const status = useAttendanceStore((s) => s.status);
  const error = useAttendanceStore((s) => s.error);
  const load = useAttendanceStore((s) => s.load);

  if (data) return children(data);
  if (status === 'error') return <ErrorState error={error} onRetry={() => load({ force: true })} />;
  return skeleton ?? <DashboardSkeleton />;
}
