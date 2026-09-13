import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, FileText, Brain, CalendarCheck, MessageCircle, LogOut, SlidersHorizontal } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import type { HeartbeatSummary } from '../types';

const navItems = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/materials', label: 'Material', icon: FileText },
  { to: '/app/review', label: 'Review', icon: Brain },
  { to: '/app/schedule', label: 'Schedule', icon: CalendarCheck },
  { to: '/app/ask', label: 'Ask', icon: MessageCircle },
];

export function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [heartbeat, setHeartbeat] = useState<HeartbeatSummary | null>(null);

  useEffect(() => {
    api.getHeartbeatSummary().then(setHeartbeat).catch(() => {});
  }, []);

  const dotFor = (to: string) => {
    if (!heartbeat) return false;
    if (to === '/app/review') return heartbeat.due_flashcards_count > 0;
    if (to === '/app/schedule') return heartbeat.urgent_tasks_count > 0;
    return false;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-sm border-b border-zinc-100">
        <div className="mx-auto max-w-4xl px-5 h-14 flex items-center gap-4">
          <NavLink to="/app" className="flex items-center gap-2 shrink-0">
            <Brain className="w-4 h-4 text-zinc-900" />
            <span className="text-sm font-semibold text-zinc-900 hidden sm:block">AcademiaClaw</span>
          </NavLink>

          <nav className="hidden sm:flex items-center gap-0.5 ml-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative h-8 px-2.5 inline-flex items-center rounded-md text-[13px] font-medium transition-colors ${
                    isActive ? 'text-zinc-900 bg-zinc-100' : 'text-zinc-500 hover:text-zinc-900'
                  }`
                }
              >
                {item.label}
                {dotFor(item.to) && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-600" />
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          <span className="hidden md:block text-xs text-zinc-400 truncate max-w-[180px]">
            {user?.name}
            {user?.university ? ` · ${user.university}` : ''}
          </span>
          <NavLink to="/admin" className="btn-ghost btn-sm" title="Admin panel">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </NavLink>
          <button onClick={handleLogout} className="btn-ghost btn-sm" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {heartbeat && (heartbeat.due_flashcards_count > 0 || heartbeat.urgent_tasks_count > 0) && (
        <div className="border-b border-zinc-100 bg-zinc-50/70">
          <div className="mx-auto max-w-4xl px-5 py-2.5 flex items-center gap-2 text-[13px]">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
            <span className="text-zinc-600 truncate">
              {heartbeat.due_flashcards_count} cards due · {heartbeat.urgent_tasks_count} deadlines approaching
            </span>
            <NavLink to="/app/review" className="ml-auto shrink-0 font-medium text-brand-600 hover:underline">
              Review
            </NavLink>
          </div>
        </div>
      )}

      <main className="flex-1 mx-auto max-w-4xl w-full px-5 py-8 pb-24 sm:pb-8">
        <Outlet />
      </main>

      {/* mobile tabs */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-sm border-t border-zinc-100">
        <div className="flex h-14">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex-1 flex flex-col items-center justify-center gap-0.5 ${
                  isActive ? 'text-zinc-900' : 'text-zinc-400'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {dotFor(item.to) && (
                <span className="absolute top-2 right-1/2 translate-x-3 w-1.5 h-1.5 rounded-full bg-brand-600" />
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <footer className="hidden sm:block border-t border-zinc-100">
        <div className="mx-auto max-w-4xl px-5 py-5 text-xs text-zinc-400">
          LightRAG · FSRS-6 · OpenClaw Gateway
        </div>
      </footer>
    </div>
  );
}
