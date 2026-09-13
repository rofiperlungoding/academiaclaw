export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-3 ${className}`} />;
}

/** Matches the dashboard's 4-up stat row. */
export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-zinc-100">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="py-5 pr-5 border-b lg:border-b-0 border-zinc-100 space-y-2.5">
          <div className="skeleton h-6 w-14" />
          <div className="skeleton h-2.5 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Matches the seamless hairline-divided list rows. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="list border-t border-zinc-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="list-row">
          <div className="skeleton w-1.5 h-1.5 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-48" />
            <div className="skeleton h-2.5 w-28" />
          </div>
          <div className="skeleton h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChat({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton h-2.5 w-16" />
          <div className={`skeleton h-3 ${i % 2 ? 'w-2/5' : 'w-3/5'}`} />
        </div>
      ))}
    </div>
  );
}
