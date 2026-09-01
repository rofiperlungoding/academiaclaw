import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileStack,
  Layers,
  ListChecks,
  Terminal,
  Settings,
  ArrowLeft,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-30">
        <div className="h-14 flex items-center px-5 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-900 tracking-tight">Admin Panel</span>
          <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">v1.0</span>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-xs">
            {gateway?.gateway_reachable ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="text-slate-600 font-medium truncate">
              {gateway?.gateway_reachable ? 'Gateway Online' : 'Gateway Offline'}
            </span>
          </div>

          <NavLink
            to="/app"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke App
          </NavLink>
        </div>
      </aside>

      <div className="flex-1 ml-56">
        <main className="max-w-6xl mx-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
