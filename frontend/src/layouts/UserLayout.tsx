import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Brain, CalendarCheck, MessageCircle } from 'lucide-react';

const navItems = [
  { to: '/app', label: 'Beranda', icon: BookOpen, end: true },
  { to: '/app/review', label: 'Review', icon: Brain },
  { to: '/app/schedule', label: 'Jadwal', icon: CalendarCheck },
  { to: '/app/ask', label: 'Tanya AI', icon: MessageCircle },
];

export function UserLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <NavLink to="/app" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-200">
              <Brain className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">
              AcademiaClaw
            </span>
          </NavLink>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <NavLink
            to="/admin"
            className="text-xs font-medium text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Admin
          </NavLink>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-100 py-4">
        <p className="text-center text-xs text-slate-400 font-medium">
          AcademiaClaw &middot; AI Competition IDwebhost &middot; LightRAG + FSRS-6
        </p>
      </footer>
    </div>
  );
}
