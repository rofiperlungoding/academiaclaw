import type { ReactNode } from 'react';
import { Inbox, FileX, ListChecks, Search, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-300" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* Preset empty states */
export function EmptyDocuments({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      icon={FileX}
      title="Belum ada dokumen"
      description="Unggah materi kuliah untuk memulai ekstraksi Knowledge Graph."
      action={action}
    />
  );
}

export function EmptyFlashcards({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      icon={Inbox}
      title="Belum ada flashcard"
      description="Flashcard akan dibuat otomatis dari dokumen yang diunggah, atau buat secara manual."
      action={action}
    />
  );
}

export function EmptyTasks({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      icon={ListChecks}
      title="Tidak ada tugas"
      description="Semua tugas kuliah sudah terselesaikan. Tambah agenda baru."
      action={action}
    />
  );
}

export function EmptySearch() {
  return (
    <EmptyState
      icon={Search}
      title="Tidak ditemukan"
      description="Coba gunakan kata kunci lain atau hapus filter pencarian."
    />
  );
}
