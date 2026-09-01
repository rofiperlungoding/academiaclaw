import { useEffect, useState } from 'react';
import { FileStack, Layers, ListChecks, Wifi, WifiOff } from 'lucide-react';
import type { RetentionStats, GatewayStatus } from '../../types';
import { api } from '../../api';

export function AdminDashboardPage() {
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
    { label: 'Dokumen Terupload', value: docCount, icon: FileStack, color: 'text-blue-500 bg-blue-50' },
    { label: 'Total Flashcards', value: stats?.total_cards ?? 0, icon: Layers, color: 'text-violet-500 bg-violet-50' },
    { label: 'Tugas Akademik', value: taskCount, icon: ListChecks, color: 'text-amber-500 bg-amber-50' },
    { label: 'Kartu Due Hari Ini', value: stats?.due_today ?? 0, icon: Layers, color: 'text-emerald-500 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">Overview sistem AcademiaClaw.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-card transition-shadow">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${m.color}`}>
              <m.icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{m.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Gateway Status</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            {gateway?.gateway_reachable
              ? <Wifi className="w-4 h-4 text-emerald-500" />
              : <WifiOff className="w-4 h-4 text-slate-400" />
            }
            <span className="text-slate-700 font-medium">
              {gateway?.gateway_reachable ? 'Online' : 'Offline'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500">URL</span>
            <p className="text-sm text-slate-700 font-mono">{gateway?.gateway_url ?? '-'}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Active Agent</span>
            <p className="text-sm text-slate-700">{gateway?.active_agent ?? '-'}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Active Model</span>
            <p className="text-sm text-slate-700 font-mono">{gateway?.active_model ?? '-'}</p>
          </div>
        </div>
      </div>

      {stats && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">FSRS-6 Retention Overview</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-slate-900">{stats.new_cards}</p>
              <p className="text-xs text-slate-500">New</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{stats.learning_cards}</p>
              <p className="text-xs text-slate-500">Learning</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{stats.review_cards}</p>
              <p className="text-xs text-slate-500">Review</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-blue-600">{Math.round(stats.average_retrievability * 100)}%</p>
              <p className="text-xs text-slate-500">Avg Retention</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
