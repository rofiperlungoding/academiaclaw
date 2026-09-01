import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Brain,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  Network,
  Clock,
  Zap,
  GraduationCap,
  ChevronDown,
  GitBranch,
  Database,
  Bot,
  Target,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Network,
    title: 'LightRAG Knowledge Graph',
    subtitle: 'Dual-Level Retrieval',
    description:
      'Ekstraksi entitas dan relasi dari materi kuliah ke Knowledge Graph. Low-level retrieval untuk fakta spesifik, high-level untuk sintesis antar-topik.',
    badge: 'HKU Research',
    color: 'brand',
  },
  {
    icon: Brain,
    title: 'FSRS-6 Active Recall',
    subtitle: 'Spaced Repetition AI',
    description:
      'Algoritma free spaced repetition scheduler generasi ke-6. Memodelkan stabilitas memori individu, menjadwalkan review pada titik optimal kurva lupa.',
    badge: 'Open-Source',
    color: 'violet',
  },
  {
    icon: Bot,
    title: 'OpenClaw Proactive Agent',
    subtitle: 'Heartbeat Daemon',
    description:
      'Gateway AI multi-model dengan ClawRouter. Mengirim pengingat proaktif berdasarkan heartbeat daemon, bukan hanya merespons ketika ditanya.',
    badge: 'Agentic AI',
    color: 'emerald',
  },
];

const TECH_STACK = [
  { name: 'FastAPI', role: 'Backend' },
  { name: 'LightRAG', role: 'Graph RAG' },
  { name: 'FSRS-6', role: 'Memory' },
  { name: 'OpenClaw', role: 'Agent Gateway' },
  { name: 'React', role: 'Frontend' },
  { name: 'Nginx', role: 'Proxy' },
];

const STATS = [
  { value: '83.6%', label: 'Win-rate vs Naive RAG', icon: Target },
  { value: '70%+', label: 'Hemat biaya vs GraphRAG', icon: Zap },
  { value: '4GB', label: 'VPS RAM constraint', icon: Database },
  { value: '<2s', label: 'Average response time', icon: Clock },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCTA = () => {
    navigate(isAuthenticated ? '/app' : '/login');
  };

  return (
    <div className="min-h-screen bg-surface-50 overflow-x-hidden">
      {/* ——— NAVIGATION BAR ——— */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-glow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-slate-900 block leading-tight">
                AcademiaClaw
              </span>
              <span className="text-[10px] text-slate-400 font-medium block leading-tight">
                Academic Copilot
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#features"
              className="hidden sm:block text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5"
            >
              Fitur
            </a>
            <a
              href="#architecture"
              className="hidden sm:block text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5"
            >
              Arsitektur
            </a>
            <button onClick={handleCTA} className="btn-primary text-xs px-4 py-2">
              {isAuthenticated ? 'Dashboard' : 'Masuk'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ——— HERO SECTION ——— */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-200/30 blur-[120px] animate-float" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-violet-200/25 blur-[100px] animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-emerald-200/15 blur-[80px] animate-glow-pulse" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-[11px] font-medium mb-6 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>IDwebhost AI Competition 2026</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-5 animate-slide-up text-balance leading-[1.1]">
            Your Proactive{' '}
            <span className="gradient-text">Academic Copilot</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto mb-10 animate-slide-up stagger-1 text-balance leading-relaxed">
            Copilot akademik universal untuk universitas di seluruh dunia. Unggah materi kuliah PDF atau modul apapun — AI otomatis menyusun Knowledge Graph, membuat Flashcards FSRS-6, dan memandu belajar secara proaktif.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up stagger-2">
            <button onClick={handleCTA} className="btn-primary text-sm px-6 py-3 shadow-glow-brand">
              <GraduationCap className="w-4 h-4" />
              <span>{isAuthenticated ? 'Buka Dashboard' : 'Masuk ke Dashboard'}</span>
            </button>
            <a href="#features" className="btn-secondary text-sm px-6 py-3">
              <BookOpen className="w-4 h-4" />
              <span>Pelajari Selengkapnya</span>
            </a>
          </div>

          {/* Floating stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in stagger-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="glass-subtle border border-white/40 rounded-2xl px-4 py-3.5 text-center group hover:shadow-card-hover transition-all duration-300"
              >
                <stat.icon className="w-4 h-4 text-brand-500 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center mt-12 animate-bounce-subtle">
          <a href="#features" className="text-slate-300 hover:text-slate-500 transition-colors">
            <ChevronDown className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* ——— FEATURES SECTION ——— */}
      <section id="features" className="py-20 sm:py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-brand mb-3">
              <Layers className="w-3 h-3" />
              Core Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3 text-balance">
              Tiga Pilar Teknologi Mutakhir
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Menggabungkan riset terkini dari Hong Kong University, open-source FSRS, dan
              framework agentic AI menjadi satu copilot akademik yang kohesif.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const colorMap: Record<string, string> = {
                brand: 'from-brand-500 to-brand-700',
                violet: 'from-violet-500 to-violet-600',
                emerald: 'from-emerald-500 to-emerald-700',
              };
              const iconBg = colorMap[f.color] || colorMap.brand;

              return (
                <div
                  key={f.title}
                  className={`card p-6 hover:shadow-elevated transition-all duration-300 group animate-slide-up stagger-${i + 1}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}
                    >
                      <f.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">{f.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{f.description}</p>

                  <span className="badge bg-slate-50 text-slate-500 border border-slate-200/80">
                    {f.badge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ——— ARCHITECTURE SECTION ——— */}
      <section id="architecture" className="py-20 sm:py-28 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-brand mb-3">
              <GitBranch className="w-3 h-3" />
              System Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3 text-balance">
              Arsitektur Sistem pada VPS 4GB
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Seluruh stack berjalan efisien di satu VPS IDwebhost 4GB RAM.
              Desain efisien tanpa kompromi kapabilitas.
            </p>
          </div>

          {/* Architecture diagram */}
          <div className="card p-8 max-w-3xl mx-auto">
            <div className="space-y-4">
              {/* Layer: Frontend */}
              <div className="flex items-center gap-4">
                <div className="w-28 shrink-0 text-right">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Client</span>
                </div>
                <div className="flex-1 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-900">React + Vite + TailwindCSS</p>
                    <p className="text-[10px] text-brand-600">SPA served from /frontend/dist</p>
                  </div>
                </div>
              </div>

              {/* Connector */}
              <div className="flex items-center gap-4">
                <div className="w-28" />
                <div className="flex-1 flex justify-center">
                  <div className="w-px h-6 bg-slate-200" />
                </div>
              </div>

              {/* Layer: Nginx */}
              <div className="flex items-center gap-4">
                <div className="w-28 shrink-0 text-right">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Proxy</span>
                </div>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Nginx Reverse Proxy</p>
                    <p className="text-[10px] text-slate-500">Port 80 → Backend :8000 + OpenClaw :18789</p>
                  </div>
                </div>
              </div>

              {/* Connector */}
              <div className="flex items-center gap-4">
                <div className="w-28" />
                <div className="flex-1 flex justify-center">
                  <div className="w-px h-6 bg-slate-200" />
                </div>
              </div>

              {/* Layer: Backend */}
              <div className="flex items-center gap-4">
                <div className="w-28 shrink-0 text-right">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Backend</span>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                      <Database className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-900">FastAPI + LightRAG</p>
                      <p className="text-[10px] text-emerald-600">Knowledge, FSRS, Tasks</p>
                    </div>
                  </div>
                  <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-violet-900">OpenClaw Gateway</p>
                      <p className="text-[10px] text-violet-600">Node.js + ClawRouter</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tech stack badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-10">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs"
              >
                <span className="font-semibold text-slate-700">{tech.name}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{tech.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— CTA SECTION ——— */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-brand-100/30 blur-[120px]" />
        </div>

        <div className="relative max-w-xl mx-auto px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-glow-brand animate-glow-pulse">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3 text-balance">
            Siap Meningkatkan Produktivitas Akademik?
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Masuk dan lihat bagaimana AcademiaClaw menjadi copilot belajar yang benar-benar proaktif.
          </p>
          <button onClick={handleCTA} className="btn-primary text-sm px-8 py-3 shadow-glow-brand">
            <span>{isAuthenticated ? 'Buka Dashboard' : 'Masuk Sekarang'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ——— FOOTER ——— */}
      <footer className="border-t border-slate-100 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-slate-600">AcademiaClaw</span>
            <span>&middot;</span>
            <span>IDwebhost AI Competition 2026</span>
          </div>
          <p>
            Powered by LightRAG &middot; FSRS-6 &middot; OpenClaw Gateway
          </p>
        </div>
      </footer>
    </div>
  );
}
