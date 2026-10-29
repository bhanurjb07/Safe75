/** Shimmer placeholders shown while data loads. */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading your attendance">
      <div className="card card-pad flex flex-col items-center gap-6 md:flex-row">
        <Skeleton className="h-52 w-52 !rounded-full" />
        <div className="w-full flex-1 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card card-pad space-y-3">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
      <ListSkeleton count={4} />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function ListSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card card-pad space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-16 !rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-2.5 w-full !rounded-full" />
        </div>
      ))}
    </div>
  );
}
