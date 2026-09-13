import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`py-14 text-center border-t border-zinc-100 ${className}`}>
      <p className="text-[13px] font-medium text-zinc-700">{title}</p>
      {description && (
        <p className="mt-1.5 mx-auto max-w-xs text-xs leading-relaxed text-zinc-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function EmptyDocuments({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      title="No documents yet"
      description="Upload course material to start building the knowledge graph."
      action={action}
    />
  );
}

export function EmptyFlashcards({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      title="No flashcards yet"
      description="Cards are generated from uploaded documents, or you can add them manually."
      action={action}
    />
  );
}

export function EmptyTasks({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      title="No tasks"
      description="Everything is done. Add a new item whenever you need to."
      action={action}
    />
  );
}

export function EmptySearch() {
  return (
    <EmptyState
      title="No results"
      description="Try a different keyword or clear the filter."
    />
  );
}
