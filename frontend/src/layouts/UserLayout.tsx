import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Brain, CalendarCheck, MessageCircle, Sparkles, User } from 'lucide-react';
import { api } from '../api';
import type { HeartbeatSummary } from '../types';

const navItems = [
  { to: '/app', label: 'Beranda', icon: BookOpen, end: true },
  { to: '/app/review', label: 'Review', icon: Brain },
  { to: '/app/schedule', label: 'Jadwal', icon: CalendarCheck },
  { to: '/app/ask', label: 'Tanya AI', icon: MessageCircle },
];

export function UserLayout() {
  const [heartbeat, setHeartbeat] = useState<HeartbeatSummary | null>(null);

  useEffect(() => {
    api.getHeartbeatSummary().then(setHeartbeat).catch(() => {});
  }, []);

  const hasUrgent = heartbeat && (heartbeat.urgent_tasks_count > 0 || heartbeat.due_flashcards_count > 0);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <NavLink to="/app" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-200 group-hover:scale-105 transition-transform duration-200">
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

          <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 relative ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.to === '/app/review' && heartbeat && heartbeat.due_flashcards_count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-1 right-1" />
                )}
                {item.to === '/app/schedule' && heartbeat && heartbeat.urgent_tasks_count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Rofi</span>
              <span className="text-slate-400 text-[10px]">· FILKOM</span>
            </div>

            <NavLink
              to="/admin"
              className="text-xs font-medium text-slate-500 hover:text-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin</span>
            </NavLink>
          </div>
        </div>
      </header>

      {hasUrgent && (
        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border-b border-blue-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-blue-900 font-medium">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>
                Heartbeat Reminder: {heartbeat.due_flashcards_count} kartu siap review dan {heartbeat.urgent_tasks_count} tugas mendekati deadline.
              </span>
            </div>
            <NavLink to="/app/review" className="text-blue-600 hover:text-blue-800 font-semibold underline text-xs">
              Mulai Review &rarr;
            </NavLink>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-100 py-4 bg-white">
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
