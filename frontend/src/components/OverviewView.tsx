import React from 'react';
import {
  Brain,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Cpu,
  Radio,
  FileText
} from 'lucide-react';
import type { RetentionStats, AcademicTask, HeartbeatSummary, GatewayStatus } from '../types';

interface OverviewViewProps {
  stats: RetentionStats | null;
  tasks: AcademicTask[];
  heartbeat: HeartbeatSummary | null;
  gatewayStatus: GatewayStatus | null;
  onNavigate: (tab: string) => void;
  onToggleTask: (taskId: string, currentStatus: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  tasks,
  heartbeat,
  gatewayStatus,
  onNavigate,
  onToggleTask,
}) => {
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const urgentTasks = pendingTasks.slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono">
              AcademiaClaw Core Engine
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Autonomous Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-2">
            Academic Knowledge & Retention Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Dual-Level LightRAG retrieval memetakan materi kuliah secara simultan dengan penjadwalan kuis FSRS-6 dan pemantauan tugas proaktif OpenClaw.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('knowledge')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Upload Materi
          </button>
          <button
            onClick={() => onNavigate('flashcards')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-lg shadow-blue-600/30"
          >
            <Brain className="w-4 h-4" />
            Mulai Review ({stats?.due_today ?? 0})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">FSRS-6 Retention Score</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">
              {stats?.average_retrievability ?? 90}%
            </span>
            <span className="text-xs text-emerald-400">Target 90% DSR</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Daya ingat optimal dengan reduksi 20-30% volume review dibanding SM-2.
          </p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Due Flashcards Today</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">
              {stats?.due_today ?? 0}
            </span>
            <span className="text-xs text-slate-400">/ {stats?.total_cards ?? 0} total kartu</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {stats?.learning_cards ?? 0} fase belajar · {stats?.review_cards ?? 0} fase review memori.
          </p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Academic Tasks</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">{pendingTasks.length}</span>
            <span className="text-xs text-amber-400">
              {heartbeat?.urgent_tasks_count ?? 0} mendekati deadline
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Tersinkronisasi otomatis dengan memori terkompilasi OpenClaw.
          </p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gateway Runtime</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-sm font-bold text-slate-100 font-mono">
              {gatewayStatus?.active_model ? gatewayStatus.active_model.split('/').pop() : 'oc/hy3-free'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            OpenClaw Gateway 2026.7.1-2 · Port 18789 VPS IDwebhost.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                7-Day FSRS-6 Retention & Due Load Forecast
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proyeksi peluruhan daya ingat (Power-Law Forgetting Curve) dan beban kuis harian.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mt-4 pt-2">
            {stats?.retention_forecast_7d?.map((f, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/40 transition-all text-center"
              >
                <span className="text-[11px] font-mono text-slate-400">
                  {idx === 0 ? 'Hari Ini' : `+${f.day_offset}h`}
                </span>
                
                <div className="my-3 flex flex-col items-center">
                  <div
                    className="w-8 rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-500 mb-1"
                    style={{ height: `${Math.max(16, Math.min(60, f.due_cards * 10))}px` }}
                  />
                  <span className="text-xs font-bold text-slate-200">{f.due_cards}</span>
                  <span className="text-[9px] text-slate-400">kartu</span>
                </div>

                <div className="w-full pt-1.5 border-t border-slate-700/60">
                  <span className="text-[10px] font-mono font-semibold text-emerald-400">
                    {f.projected_retention}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                OpenClaw Heartbeat Sentinel
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Cron 30m
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
                <div className="text-slate-300 font-semibold mb-1">Strategi Proaktif Bebas Biaya</div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Daemon memeriksa kartu review & deadline secara deterministik tanpa menembus aturan WhatsApp Per-Message Pricing Meta (dalam jendela 24 jam bebas tarif).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Notifikasi WhatsApp</span>
                  <span className="text-emerald-400 font-mono">Customer-Initiated</span>
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1.5">
                  <span className="text-slate-400">Resource VPS 4GB</span>
                  <span className="text-blue-400 font-mono">Lightweight Node Gateway</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('agent')}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Buka OpenClaw Terminal
          </button>
        </div>
      </div>

      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Tenggat Waktu Akademik Terdekat
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tugas dan praktikum yang diekstrak langsung oleh LightRAG dari materi perkuliahan.
            </p>
          </div>
          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
          >
            Lihat Semua Tasks <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {urgentTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Belum ada tugas perkuliahan pending. Upload dokumen materi untuk ekstraksi otomatis.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleTask(task.id, task.status)}
                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                        {task.course}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Due {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                    task.priority === 'high'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
