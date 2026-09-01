import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Brain, CalendarCheck, MessageCircle, Sparkles, LogOut } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import type { HeartbeatSummary } from '../types';

const navItems = [
  { to: '/app', label: 'Beranda', icon: BookOpen, end: true },
  { to: '/app/materials', label: 'Materi', icon: FileText },
  { to: '/app/review', label: 'Review', icon: Brain },
  { to: '/app/schedule', label: 'Jadwal', icon: CalendarCheck },
  { to: '/app/ask', label: 'Tanya AI', icon: MessageCircle },
];

export function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [heartbeat, setHeartbeat] = useState<HeartbeatSummary | null>(null);

  useEffect(() => {
    api.getHeartbeatSummary().then(setHeartbeat).catch(() => {});
  }, []);

  const hasUrgent = heartbeat && (heartbeat.urgent_tasks_count > 0 || heartbeat.due_flashcards_count > 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* ——— HEADER ——— */}
      <header className="sticky top-0 z-40 glass-heavy border-b border-slate-200/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/app" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-glow-sm group-hover:scale-105 transition-transform duration-200">
              <Brain className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-slate-900 block leading-tight">
                AcademiaClaw
              </span>
              <span className="text-[10px] text-slate-400 font-medium block leading-tight">
                Academic Copilot
              </span>
            </div>
          </NavLink>

          {/* Navigation — Desktop */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/50">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${
                    isActive
                      ? 'bg-white text-brand-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.to === '/app/review' && heartbeat && heartbeat.due_flashcards_count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-brand-500 absolute top-1 right-1 animate-glow-pulse" />
                )}
                {item.to === '/app/schedule' && heartbeat && heartbeat.urgent_tasks_count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
                )}
              </NavLink>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-[9px] font-bold text-white">
                {initials}
              </div>
              <div className="text-xs">
                <span className="font-medium text-slate-700">{user?.name?.split(' ')[0] || 'User'}</span>
                <span className="text-slate-400 ml-1 text-[10px]">· {user?.university || user?.faculty || 'Akademik'}</span>
              </div>
            </div>

            <NavLink
              to="/admin"
              className="text-xs font-medium text-slate-500 hover:text-brand-600 px-2.5 py-1.5 rounded-lg hover:bg-brand-50 transition-colors border border-transparent hover:border-brand-100 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </NavLink>

            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ——— HEARTBEAT BANNER ——— */}
      {hasUrgent && (
        <div className="bg-gradient-to-r from-brand-500/10 via-violet-500/10 to-brand-500/10 border-b border-brand-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-brand-900 font-medium">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              <span>
                Heartbeat: {heartbeat!.due_flashcards_count} kartu siap review dan {heartbeat!.urgent_tasks_count} tugas mendekati deadline.
              </span>
            </div>
            <NavLink to="/app/review" className="text-brand-600 hover:text-brand-800 font-semibold underline text-xs">
              Mulai Review &rarr;
            </NavLink>
          </div>
        </div>
      )}

      {/* ——— MAIN ——— */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {/* ——— MOBILE BOTTOM TAB BAR ——— */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 glass-heavy border-t border-slate-200/50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 relative ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
              {item.to === '/app/review' && heartbeat && heartbeat.due_flashcards_count > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 absolute top-0.5 right-1.5" />
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ——— FOOTER ——— */}
      <footer className="hidden sm:block border-t border-slate-100 py-4 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-medium">
          <p>
            AcademiaClaw &middot; Academic Copilot for IDwebhost AI Competition
          </p>
          <p>
            Powered by LightRAG &middot; FSRS-6 &middot; OpenClaw Gateway
          </p>
        </div>
      </footer>
    </div>
  );
}
