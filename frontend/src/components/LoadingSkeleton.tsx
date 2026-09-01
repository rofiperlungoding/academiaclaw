interface SkeletonProps {
  className?: string;
}

export function SkeletonLine({ className = '' }: SkeletonProps) {
  return <div className={`skeleton h-4 rounded ${className}`} />;
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`card p-5 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-2.5 w-16 rounded" />
        </div>
      </div>
      <div className="skeleton h-8 w-20 rounded" />
      <div className="skeleton h-2.5 w-32 rounded" />
    </div>
  );
}

export function SkeletonStatRow({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-3">
          <div className="skeleton w-3 h-3 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3 w-48 rounded" />
            <div className="skeleton h-2.5 w-32 rounded" />
          </div>
          <div className="skeleton h-5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChat({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => {
        const isUser = i % 2 === 1;
        return (
          <div key={i} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
            <div className={`skeleton rounded-2xl ${isUser ? 'w-2/5 h-12' : 'w-3/5 h-16'}`} />
          </div>
        );
      })}
    </div>
  );
}
