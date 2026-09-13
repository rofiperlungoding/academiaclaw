import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileStack,
  Layers,
  ListChecks,
  Terminal,
  Settings,
  ArrowLeft,
  Brain,
} from 'lucide-react';
import type { GatewayStatus } from '../types';
import { api } from '../api';

const sidebarItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/knowledge', label: 'Knowledge', icon: FileStack },
  { to: '/admin/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/admin/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/admin/agent', label: 'Agent', icon: Terminal },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);

  useEffect(() => {
    api.getGatewayStatus().then(setGateway).catch(() => {});
  }, []);

  const online = gateway?.gateway_reachable;

  return (
    <div className="min-h-screen bg-white">
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-52 flex-col border-r border-zinc-100 bg-white">
        <div className="h-14 flex items-center gap-2 px-5">
          <Brain className="w-4 h-4 text-zinc-900" />
          <span className="text-sm font-semibold text-zinc-900">Admin</span>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-px">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[13px] font-medium transition-colors ${
                  isActive ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
                }`
              }
            >
              <item.icon className="w-[15px] h-[15px] shrink-0" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-zinc-100 space-y-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
            Gateway {online ? 'online' : 'offline'}
          </div>
          <NavLink to="/app" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700">
            <ArrowLeft className="w-3 h-3" />
            Back to app
          </NavLink>
        </div>
      </aside>

      {/* mobile top nav */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-zinc-100">
        <div className="h-14 px-5 flex items-center gap-2">
          <Brain className="w-4 h-4 text-zinc-900" />
          <span className="text-sm font-semibold text-zinc-900">Admin</span>
          <span className={`ml-auto w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
          <NavLink to="/app" className="btn-ghost btn-sm">
            <ArrowLeft className="w-3.5 h-3.5" />
          </NavLink>
        </div>
        <nav className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-none">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 h-7 px-2.5 inline-flex items-center rounded-md text-xs font-medium ${
                  isActive ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="md:ml-52">
        <div className="mx-auto max-w-4xl px-5 md:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
