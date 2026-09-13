import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Network, Brain, Bot, ArrowRight, ArrowUpRight } from 'lucide-react';

const FEATURES = [
  {
    icon: Network,
    title: 'LightRAG Knowledge Graph',
    meta: 'Dual-level retrieval',
    description:
      'Course material is parsed into entities and relations. Low-level retrieval answers specific facts, high-level synthesises across topics.',
  },
  {
    icon: Brain,
    title: 'FSRS-6 Active Recall',
    meta: 'Spaced repetition',
    description:
      'The 6th-generation Free Spaced Repetition Scheduler models memory stability, then schedules each review at the optimal point on your forgetting curve.',
  },
  {
    icon: Bot,
    title: 'OpenClaw Proactive Agent',
    meta: 'Heartbeat daemon',
    description:
      'A multi-model AI gateway that sends reminders on a heartbeat, instead of only answering when asked.',
  },
];

const STATS = [
  { value: '83.6%', label: 'Win rate vs naive RAG' },
  { value: '70%', label: 'Cheaper than GraphRAG' },
  { value: '4 GB', label: 'VPS RAM footprint' },
  { value: '<2 s', label: 'Average response' },
];

const LAYERS = [
  { tier: 'Client', name: 'React · Vite · Tailwind', detail: 'Static SPA served from /frontend/dist' },
  { tier: 'Proxy', name: 'Nginx reverse proxy', detail: 'Port 80 to backend :8000 and OpenClaw :18789' },
  { tier: 'Backend', name: 'FastAPI · LightRAG · FSRS-6', detail: 'Knowledge graph, scheduler, tasks' },
  { tier: 'Agent', name: 'OpenClaw Gateway', detail: 'Node.js and ClawRouter, heartbeat cron' },
];

const STACK = ['FastAPI', 'LightRAG', 'FSRS-6', 'OpenClaw', 'React', 'SQLite', 'Nginx'];

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const cta = () => navigate(isAuthenticated ? '/app' : '/login');

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-sm border-b border-zinc-100">
        <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-zinc-900" />
            <span className="text-sm font-semibold text-zinc-900">AcademiaClaw</span>
          </div>
          <nav className="flex items-center gap-1">
            <a href="#features" className="btn-ghost hidden sm:inline-flex">Features</a>
            <a href="#architecture" className="btn-ghost hidden sm:inline-flex">Architecture</a>
            <button onClick={cta} className="btn-primary btn-sm ml-1">
              {isAuthenticated ? 'Dashboard' : 'Sign in'}
            </button>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-20 sm:pt-32">
        <p className="eyebrow mb-5">IDwebhost AI Competition 2026</p>
        <h1 className="text-4xl sm:text-[3.25rem] font-semibold leading-[1.08] tracking-[-0.025em] text-zinc-900 max-w-2xl text-balance">
          The academic copilot that reaches out first.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-zinc-500 text-balance">
          Upload your course material as PDF. AcademiaClaw builds a knowledge graph,
          generates FSRS-6 flashcards, and schedules each review before you forget.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-2">
          <button onClick={cta} className="btn-primary">
            {isAuthenticated ? 'Open dashboard' : 'Sign in to dashboard'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <a href="#features" className="btn-secondary">See how it works</a>
        </div>

        <dl className="mt-20 grid grid-cols-2 sm:grid-cols-4 border-t border-zinc-100">
          {STATS.map((s) => (
            <div key={s.label} className="border-b sm:border-b-0 border-zinc-100 py-6 pr-6">
              <dt className="text-2xl font-semibold tracking-tight text-zinc-900">{s.value}</dt>
              <dd className="mt-1 text-xs text-zinc-500 leading-snug">{s.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* features */}
      <section id="features" className="border-t border-zinc-100 bg-zinc-50/60">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-[22px] font-semibold tracking-tight text-zinc-900">Three pillars</h2>
          <p className="mt-2 muted max-w-lg">
            Hong Kong University research, open-source FSRS, and agentic orchestration in one system.
          </p>

          <div className="mt-10 grid gap-px bg-zinc-200 sm:grid-cols-3 rounded-xl overflow-hidden border border-zinc-200">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white p-6">
                <f.icon className="w-4 h-4 text-zinc-900" strokeWidth={1.75} />
                <h3 className="mt-4 text-sm font-semibold text-zinc-900">{f.title}</h3>
                <p className="mt-0.5 text-[11px] text-zinc-400">{f.meta}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* architecture */}
      <section id="architecture" className="border-t border-zinc-100">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-[22px] font-semibold tracking-tight text-zinc-900">Architecture</h2>
          <p className="mt-2 muted max-w-lg">
            The whole stack runs on a single 4 GB IDwebhost VPS.
          </p>

          <div className="mt-10 max-w-2xl list">
            {LAYERS.map((l) => (
              <div key={l.tier} className="flex items-baseline gap-6 py-4">
                <span className="w-16 shrink-0 text-[11px] font-medium text-zinc-400">{l.tier}</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-zinc-900">{l.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{l.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-1.5">
            {STACK.map((t) => (
              <span key={t} className="badge-neutral">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* cta */}
      <section className="border-t border-zinc-100 bg-zinc-50/60">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-[22px] font-semibold tracking-tight text-zinc-900 max-w-md text-balance">
            Start with a single PDF.
          </h2>
          <button onClick={cta} className="btn-primary mt-6">
            {isAuthenticated ? 'Open dashboard' : 'Sign in now'}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-zinc-100">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400">
          <span>AcademiaClaw · IDwebhost AI Competition 2026</span>
          <span>LightRAG · FSRS-6 · OpenClaw Gateway</span>
        </div>
      </footer>
    </div>
  );
}
