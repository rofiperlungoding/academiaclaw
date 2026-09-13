import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import type { RetentionStats, AcademicTask, HeartbeatSummary, AgentNotification } from '../../types';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { SkeletonStatRow, SkeletonList } from '../../components/LoadingSkeleton';

/** FSRS retrievability arrives as either 0–1 or 0–100 depending on the endpoint. */
const toPercent = (v: number) => Math.round(v > 1 ? v : v * 100);

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [heartbeat, setHeartbeat] = useState<HeartbeatSummary | null>(null);
  const [pushes, setPushes] = useState<AgentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.getRetentionStats(),
      api.getTasks('pending'),
      api.getHeartbeatSummary(),
      api.getNotifications(5),
    ]).then(([s, t, h, n]) => {
      if (s.status === 'fulfilled') setStats(s.value);
      if (t.status === 'fulfilled') setTasks(t.value);
      if (h.status === 'fulfilled') setHeartbeat(h.value);
      if (n.status === 'fulfilled') setPushes(n.value);
      setLoading(false);
    });
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const upcoming = [...tasks]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const firstName = user?.name?.split(' ')[0] || 'User';
  const dueToday = stats?.due_today ?? 0;

  const summary = [
    { value: dueToday, label: 'Cards due today', to: '/app/review' },
    { value: heartbeat?.urgent_tasks_count ?? tasks.length, label: 'Deadlines approaching', to: '/app/schedule' },
    { value: stats ? `${toPercent(stats.average_retrievability)}%` : '—', label: 'Average FSRS-6 retention' },
    { value: stats?.total_cards ?? 0, label: 'Total cards' },
  ];

  return (
    <div className="animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900">Hi, {firstName}</h1>
          <p className="mt-1 muted">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/app/materials')} className="btn-secondary btn-sm">
            Upload material
          </button>
          <button onClick={() => navigate('/app/review')} className="btn-primary btn-sm">
            Start review
          </button>
        </div>
      </header>

      {loading ? (
        <div className="mt-8"><SkeletonStatRow /></div>
      ) : (
        <dl className="mt-8 grid grid-cols-2 lg:grid-cols-4 border-y border-zinc-100">
          {summary.map((s) => (
            <div
              key={s.label}
              onClick={s.to ? () => navigate(s.to!) : undefined}
              className={`py-5 pr-5 border-b lg:border-b-0 border-zinc-100 ${
                s.to ? 'cursor-pointer group' : ''
              }`}
            >
              <dt className="text-[26px] font-semibold tracking-[-0.02em] text-zinc-900 leading-none">
                {s.value}
              </dt>
              <dd className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
                {s.label}
                {s.to && (
                  <ArrowRight className="w-3 h-3 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {/* deadlines */}
        <section className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Upcoming deadlines</h2>
            <button
              onClick={() => navigate('/app/schedule')}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              See all ({tasks.length})
            </button>
          </div>

          {loading ? (
            <div className="mt-4"><SkeletonList rows={3} /></div>
          ) : upcoming.length === 0 ? (
            <div className="mt-4 py-10 text-center border-t border-zinc-100">
              <p className="text-[13px] text-zinc-500">No urgent deadlines.</p>
              <button onClick={() => navigate('/app/schedule')} className="btn-ghost btn-sm mt-3">
                <Plus className="w-3 h-3" /> Add task
              </button>
            </div>
          ) : (
            <div className="mt-3 list border-t border-zinc-100">
              {upcoming.map((task) => {
                const days = Math.ceil(
                  (new Date(task.deadline).getTime() - Date.now()) / 86_400_000
                );
                const tone =
                  days <= 1 ? 'text-red-600' : days <= 3 ? 'text-amber-600' : 'text-zinc-500';

                return (
                  <button
                    key={task.id}
                    onClick={() => navigate('/app/schedule')}
                    className="list-row w-full text-left hover:bg-zinc-50/70 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        task.priority === 'high'
                          ? 'bg-red-500'
                          : task.priority === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-zinc-300'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-zinc-900 truncate">{task.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-400 truncate">
                        {task.course} · {task.task_type}
                      </p>
                    </div>
                    <span className={`text-xs shrink-0 ${tone}`}>
                      {days <= 0 ? 'Today' : `${days}d`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* what the agent did on its own */}
        <section className="lg:col-span-2">
          <h2 className="section-title">Sent by the agent, unprompted</h2>
          {pushes.length === 0 ? (
            <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
              Nothing yet. The agent checks three times a day and only writes when
              something actually changed.
            </p>
          ) : (
            <div className="mt-3 list border-t border-zinc-100">
              {pushes.map((n) => (
                <div key={n.id} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] font-medium text-zinc-500">
                      {n.channel}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {new Date(n.sent_at).toLocaleString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 whitespace-pre-wrap line-clamp-4">
                    {n.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* retention forecast */}
        <section className="lg:col-span-1">
          <h2 className="section-title">7-day retention forecast</h2>

          {stats?.retention_forecast_7d?.length ? (
            <>
              <div className="mt-5 flex items-end gap-1.5 h-28">
                {stats.retention_forecast_7d.map((day, i) => {
                  const pct = toPercent(day.projected_retention);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full bg-zinc-200 group-hover:bg-brand-500 rounded-sm transition-colors"
                          style={{ height: `${Math.max(pct, 2)}%` }}
                          title={`+${day.day_offset}d · ${pct}%`}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400">{day.day_offset}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 pt-3 border-t border-zinc-100 text-[11px] text-zinc-400">
                Days ahead · 90% retention target
              </p>
            </>
          ) : (
            <p className="mt-5 text-[13px] text-zinc-400">
              Not enough review history to project a retention curve yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
