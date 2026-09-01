import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, CalendarCheck, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import type { RetentionStats, AcademicTask, HeartbeatSummary } from '../../types';
import { api } from '../../api';

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [heartbeat, setHeartbeat] = useState<HeartbeatSummary | null>(null);

  useEffect(() => {
    Promise.allSettled([
      api.getRetentionStats(),
      api.getTasks('pending'),
      api.getHeartbeatSummary(),
    ]).then(([s, t, h]) => {
      if (s.status === 'fulfilled') setStats(s.value);
      if (t.status === 'fulfilled') setTasks(t.value);
      if (h.status === 'fulfilled') setHeartbeat(h.value);
    });
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 17) return 'Selamat Siang';
    return 'Selamat Malam';
  })();

  const upcomingTasks = [...tasks]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {greeting}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Berikut ringkasan belajar dan agenda akademikmu hari ini.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/app/review')}
          className="group bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-card-hover hover:border-slate-300 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-2xl font-semibold text-slate-900">{stats?.due_today ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Kartu perlu diulang hari ini</p>
        </button>

        <button
          onClick={() => navigate('/app/schedule')}
          className="group bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-card-hover hover:border-slate-300 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-amber-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition-colors" />
          </div>
          <p className="text-2xl font-semibold text-slate-900">{heartbeat?.urgent_tasks_count ?? tasks.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Tugas & deadline aktif</p>
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-slate-900">
            {stats ? `${Math.round(stats.average_retrievability * 100)}%` : '--'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Rata-rata retensi memori</p>
        </div>
      </div>

      {stats && stats.due_today > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">
                {stats.due_today} kartu flashcard siap untuk active recall
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Review sekarang untuk memperkuat retensi jangka panjang.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/review')}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-sm shadow-blue-200"
            >
              Mulai Review
            </button>
          </div>
        </div>
      )}

      {upcomingTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900">Deadline Terdekat</h2>
            <button
              onClick={() => navigate('/app/schedule')}
              className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-2">
            {upcomingTasks.map((task, i) => {
              const dlDate = new Date(task.deadline);
              const now = new Date();
              const diffDays = Math.ceil((dlDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={task.id}
                  className={`animate-fade-in stagger-${i + 1} bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-card transition-all duration-200`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      task.priority === 'high' ? 'bg-red-400' :
                      task.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-300'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-400">{task.course}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 ml-4">
                    <Clock className="w-3.5 h-3.5" />
                    <span className={
                      diffDays <= 1 ? 'text-red-500 font-semibold' :
                      diffDays <= 3 ? 'text-amber-500 font-medium' : ''
                    }>
                      {diffDays <= 0 ? 'Hari ini' : `${diffDays}d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats?.retention_forecast_7d && stats.retention_forecast_7d.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Proyeksi Retensi 7 Hari</h2>
          <div className="flex items-end gap-2 h-28">
            {stats.retention_forecast_7d.map((day, i) => {
              const pct = Math.round(day.projected_retention * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-500">{pct}%</span>
                  <div className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height: '80px' }}>
                    <div
                      className="w-full bg-blue-400 rounded-full transition-all duration-500"
                      style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">+{day.day_offset}d</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
