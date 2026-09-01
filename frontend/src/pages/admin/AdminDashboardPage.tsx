import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileStack, Layers, ListChecks, Wifi, Terminal, Sparkles, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import type { RetentionStats, GatewayStatus } from '../../types';
import { api } from '../../api';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [docCount, setDocCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    Promise.allSettled([
      api.getRetentionStats(),
      api.getGatewayStatus(),
      api.getDocuments(),
      api.getTasks(),
    ]).then(([s, g, d, t]) => {
      if (s.status === 'fulfilled') setStats(s.value);
      if (g.status === 'fulfilled') setGateway(g.value);
      if (d.status === 'fulfilled') setDocCount(d.value.length);
      if (t.status === 'fulfilled') setTaskCount(t.value.length);
    });
  }, []);

  const metrics = [
    { label: 'Dokumen Terindeks', value: docCount, icon: FileStack, color: 'text-blue-600 bg-blue-50 border-blue-100', route: '/admin/knowledge' },
    { label: 'Total Flashcards FSRS-6', value: stats?.total_cards ?? 0, icon: Layers, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', route: '/admin/flashcards' },
    { label: 'Agenda Tugas Kuliah', value: taskCount, icon: ListChecks, color: 'text-amber-600 bg-amber-50 border-amber-100', route: '/admin/tasks' },
    { label: 'Review Due Hari Ini', value: stats?.due_today ?? 0, icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', route: '/admin/flashcards' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Admin Management Center</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              IDwebhost AI Edition
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor infrastruktur LightRAG, algoritma FSRS-6, dan OpenClaw Gateway backend.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/agent')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Open Terminal</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div
            key={i}
            onClick={() => navigate(m.route)}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:shadow-card hover:border-slate-300 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${m.color}`}>
                <m.icon className="w-4.5 h-4.5" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 tracking-tight">{m.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Gateway Infrastructure</span>
            </h2>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              gateway?.gateway_reachable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {gateway?.gateway_reachable ? 'Operational' : 'Disconnected'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Gateway URL</span>
              <p className="text-slate-800 font-mono font-medium truncate mt-0.5">
                {gateway?.gateway_url || 'http://103.30.146.109:18789'}
              </p>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Active Model</span>
              <p className="text-slate-800 font-mono font-medium truncate mt-0.5">
                {gateway?.active_model || '9router/oc/hy3-free'}
              </p>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Active Agent</span>
              <p className="text-slate-800 font-medium truncate mt-0.5">
                {gateway?.active_agent || 'main'}
              </p>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Service Status</span>
              <p className="text-emerald-700 font-medium truncate mt-0.5 flex items-center gap-1">
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span>academiaclaw.service</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>FSRS-6 Memory Engine Breakdown</span>
            </h2>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-medium">
              v6.0-FSRS
            </span>
          </div>

          {stats ? (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-lg font-semibold text-slate-900">{stats.new_cards}</p>
                <p className="text-[10px] text-slate-500 font-medium">New</p>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                <p className="text-lg font-semibold text-amber-700">{stats.learning_cards}</p>
                <p className="text-[10px] text-amber-600 font-medium">Learning</p>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                <p className="text-lg font-semibold text-blue-700">{stats.review_cards}</p>
                <p className="text-[10px] text-blue-600 font-medium">Review</p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                <p className="text-lg font-semibold text-emerald-700">
                  {Math.round(stats.average_retrievability * 100)}%
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">Retrievability</p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-4">Memuat data statistik FSRS-6...</div>
          )}

          <div className="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">
            FSRS-6 menghitung probabilitas lupa (retrievability decay) secara matematis berbasis parameter stabilitas (S) dan kesulitan (D) setiap kartu.
          </div>
        </div>
      </div>
    </div>
  );
}
