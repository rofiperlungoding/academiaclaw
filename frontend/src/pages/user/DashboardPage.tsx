import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, CalendarCheck, TrendingUp, ArrowRight, Clock, MessageSquare, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import type { RetentionStats, AcademicTask, HeartbeatSummary } from '../../types';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { SkeletonStatRow, SkeletonList } from '../../components/LoadingSkeleton';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [heartbeat, setHeartbeat] = useState<HeartbeatSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.getRetentionStats(),
      api.getTasks('pending'),
      api.getHeartbeatSummary(),
    ]).then(([s, t, h]) => {
      if (s.status === 'fulfilled') setStats(s.value);
      if (t.status === 'fulfilled') setTasks(t.value);
      if (h.status === 'fulfilled') setHeartbeat(h.value);
      setLoading(false);
    });
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 17) return 'Selamat Siang';
    return 'Selamat Malam';
  })();

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const upcomingTasks = [...tasks]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ——— HEADER ——— */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {greeting}, {firstName}
            </h1>
            <span className="badge-brand">
              {user?.program || 'Akademik'} {user?.university ? `· ${user.university}` : (user?.faculty ? `· ${user.faculty}` : '')}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {today} — Agenda belajar, kurikulum materi, dan status retensi memori FSRS-6.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/app/materials')}
            className="btn-secondary text-xs px-3.5 py-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Unggah Materi PDF</span>
          </button>
          <button
            onClick={() => navigate('/app/ask')}
            className="btn-secondary text-xs px-3.5 py-2"
          >
            <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
            <span>Tanya AI</span>
          </button>
          <button
            onClick={() => navigate('/app/schedule')}
            className="btn-primary text-xs px-3.5 py-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Tugas</span>
          </button>
        </div>
      </div>

      {/* ——— STAT CARDS ——— */}
      {loading ? (
        <SkeletonStatRow />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/app/review')}
            className="card-interactive p-5 text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Brain className="w-5 h-5 text-brand-500" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">
              {stats?.due_today ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Kartu perlu diulang hari ini</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-brand-600">
              <span>Mulai active recall</span>
              <span>&rarr;</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/app/schedule')}
            className="card-interactive p-5 text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <CalendarCheck className="w-5 h-5 text-amber-500" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">
              {heartbeat?.urgent_tasks_count ?? tasks.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Tugas mendekati deadline</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-amber-600">
              <span>Buka daftar agenda</span>
              <span>&rarr;</span>
            </div>
          </button>

          <div className="card p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                FSRS-6
              </span>
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">
              {stats ? `${Math.round(stats.average_retrievability > 1 ? stats.average_retrievability : stats.average_retrievability * 100)}%` : '--'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Rata-rata retensi memori</p>
            <div className="mt-3 text-[11px] text-slate-400">
              Total {stats?.total_cards ?? 0} kartu terdaftar
            </div>
          </div>
        </div>
      )}

      {/* ——— REVIEW CTA ——— */}
      {!loading && (
        stats && stats.due_today > 0 ? (
          <div className="bg-gradient-to-r from-brand-50 to-violet-50 border border-brand-100 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shrink-0 shadow-glow-sm">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-950">
                    {stats.due_today} kartu flashcard siap untuk Active Recall hari ini
                  </p>
                  <p className="text-xs text-brand-700 mt-0.5">
                    Algoritma FSRS-6 telah mengoptimalkan interval review untuk memperkuat stabilitas memori jangka panjang Anda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/review')}
                className="btn-primary text-xs px-4 py-2.5 shrink-0"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Review Sekarang</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-900">
                  Semua review flashcard hari ini sudah selesai
                </p>
                <p className="text-[11px] text-emerald-700">
                  Hebat! Retensi memori Anda dalam kondisi prima.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/app/review')}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 transition-colors"
            >
              Review Bebas
            </button>
          </div>
        )
      )}

      {/* ——— TASKS + RETENTION ——— */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Deadline Terdekat</h2>
            <button
              onClick={() => navigate('/app/schedule')}
              className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
            >
              Lihat Semua ({tasks.length})
            </button>
          </div>

          {loading ? (
            <SkeletonList rows={3} />
          ) : upcomingTasks.length === 0 ? (
            <div className="card p-8 text-center">
              <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Tidak ada deadline mendesak</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Semua tugas kuliah saat ini sudah terselesaikan.
              </p>
              <button
                onClick={() => navigate('/app/schedule')}
                className="btn-ghost text-xs inline-flex"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Agenda</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task, i) => {
                const dlDate = new Date(task.deadline);
                const now = new Date();
                const diffDays = Math.ceil((dlDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={task.id}
                    onClick={() => navigate('/app/schedule')}
                    className={`animate-fade-in stagger-${i + 1} card-interactive p-4 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        task.priority === 'high' ? 'bg-red-400' :
                        task.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-300'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-medium">{task.course}</span>
                          <span className="text-slate-300 text-[10px]">&middot;</span>
                          <span className="text-[10px] text-slate-400">{task.task_type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 ml-4">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className={
                        diffDays <= 1 ? 'text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-md border border-red-100' :
                        diffDays <= 3 ? 'text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100' :
                        'text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60'
                      }>
                        {diffDays <= 0 ? 'Hari ini' : `${diffDays} hari lagi`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ——— RETENTION FORECAST ——— */}
        <div className="space-y-3">
          <h2 className="section-title">Proyeksi Retensi 7 Hari</h2>

          <div className="card p-5 shadow-xs">
            {stats?.retention_forecast_7d && stats.retention_forecast_7d.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-end gap-2 h-32 pt-4">
                  {stats.retention_forecast_7d.map((day, i) => {
                    const pct = Math.round(day.projected_retention > 1 ? day.projected_retention : day.projected_retention * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <span className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {pct}%
                        </span>
                        <div className="w-full bg-slate-100 rounded-lg overflow-hidden relative" style={{ height: '90px' }}>
                          <div
                            className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-lg transition-all duration-500 group-hover:from-brand-700 group-hover:to-brand-500 absolute bottom-0"
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">+{day.day_offset}d</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Target Retensi: 90%</span>
                  <span className="font-mono text-brand-600 font-medium">FSRS v6</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada data review untuk memproyeksikan kurva retensi.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
