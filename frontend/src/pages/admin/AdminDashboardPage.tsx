import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { RetentionStats, GatewayStatus } from '../../types';
import { api } from '../../api';

const toPercent = (v: number) => Math.round(v > 1 ? v : v * 100);

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
    { label: 'Documents indexed', value: docCount, route: '/admin/knowledge' },
    { label: 'Total flashcards', value: stats?.total_cards ?? 0, route: '/admin/flashcards' },
    { label: 'Tasks tracked', value: taskCount, route: '/admin/tasks' },
    { label: 'Due today', value: stats?.due_today ?? 0, route: '/admin/flashcards' },
  ];

  const gatewayRows = [
    ['Endpoint', gateway?.gateway_url ?? '—'],
    ['Active model', gateway?.active_model ?? '—'],
    ['Active agent', gateway?.active_agent ?? '—'],
    ['Service', 'academiaclaw.service'],
  ];

  const fsrsRows = stats
    ? [
        ['New', stats.new_cards],
        ['Learning', stats.learning_cards],
        ['Review', stats.review_cards],
        ['Retrievability', `${toPercent(stats.average_retrievability)}%`],
      ]
    : [];

  return (
    <div className="animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="mt-1 muted">Monitor LightRAG, FSRS-6, and the OpenClaw Gateway.</p>
        </div>
        <button onClick={() => navigate('/admin/agent')} className="btn-primary btn-sm">
          Open terminal
        </button>
      </header>

      <dl className="mt-8 grid grid-cols-2 lg:grid-cols-4 border-y border-zinc-100">
        {metrics.map((m) => (
          <div
            key={m.label}
            onClick={() => navigate(m.route)}
            className="py-5 pr-5 border-b lg:border-b-0 border-zinc-100 cursor-pointer group"
          >
            <dt className="text-[26px] font-semibold tracking-[-0.02em] text-zinc-900 leading-none">
              {m.value}
            </dt>
            <dd className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
              {m.label}
              <ArrowRight className="w-3 h-3 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="section-title">Gateway</h2>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  gateway?.gateway_reachable ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              {gateway?.gateway_reachable ? 'Operational' : 'Disconnected'}
            </span>
          </div>
          <dl className="mt-3 list border-t border-zinc-100">
            {gatewayRows.map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-4 py-2.5">
                <dt className="w-28 shrink-0 text-xs text-zinc-400">{k}</dt>
                <dd className="text-[13px] text-zinc-800 truncate">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="section-title">FSRS-6 memory engine</h2>
          {stats ? (
            <dl className="mt-3 list border-t border-zinc-100">
              {fsrsRows.map(([k, v]) => (
                <div key={String(k)} className="flex items-baseline gap-4 py-2.5">
                  <dt className="w-28 shrink-0 text-xs text-zinc-400">{k}</dt>
                  <dd className="text-[13px] font-medium text-zinc-900">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-[13px] text-zinc-400">Loading stats…</p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-zinc-400 max-w-sm">
            FSRS-6 derives forgetting probability from each card stability (S) and difficulty (D).
          </p>
        </section>
      </div>
    </div>
  );
}
