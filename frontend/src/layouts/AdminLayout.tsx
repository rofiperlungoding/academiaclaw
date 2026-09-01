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
  Brain,
  ChevronLeft,
  ChevronRight,
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    api.getGatewayStatus().then(setGateway).catch(() => {});
  }, []);

  const sidebarWidth = collapsed ? 'w-16' : 'w-56';
  const mainMargin = collapsed ? 'ml-16' : 'ml-56';

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* ——— SIDEBAR ——— */}
      <aside
        className={`${sidebarWidth} bg-white border-r border-slate-200/80 flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-out`}
      >
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-slate-100 gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <span className="text-sm font-semibold text-slate-900 tracking-tight block truncate">Admin Panel</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">v1.0</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand-500" />
                  )}
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-slate-100 space-y-1.5">
          {/* Gateway status */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-xs ${collapsed ? 'justify-center px-2' : ''}`}
            title={collapsed ? (gateway?.gateway_reachable ? 'Gateway Online' : 'Gateway Offline') : undefined}
          >
            {gateway?.gateway_reachable ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            {!collapsed && (
              <span className="text-slate-600 font-medium truncate">
                {gateway?.gateway_reachable ? 'Gateway Online' : 'Gateway Offline'}
              </span>
            )}
          </div>

          {/* Back to app */}
          <NavLink
            to="/app"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors ${collapsed ? 'justify-center px-2' : ''}`}
            title={collapsed ? 'Kembali ke App' : undefined}
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Kembali ke App</span>}
          </NavLink>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ——— MAIN CONTENT ——— */}
      <div className={`flex-1 ${mainMargin} transition-all duration-300 ease-out`}>
        <main className="max-w-6xl mx-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
