import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Server } from 'lucide-react';
import type { GatewayStatus, ModelItem } from '../../types';
import { api } from '../../api';

export function SettingsPage() {
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [models, setModels] = useState<ModelItem[]>([]);

  useEffect(() => {
    Promise.allSettled([api.getGatewayStatus(), api.getModels()]).then(([g, m]) => {
      if (g.status === 'fulfilled') setGateway(g.value);
      if (m.status === 'fulfilled') setModels(m.value);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Konfigurasi gateway dan model AI.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-500" />
          OpenClaw Gateway
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <div className="flex items-center gap-2">
              {gateway?.gateway_reachable
                ? <Wifi className="w-4 h-4 text-emerald-500" />
                : <WifiOff className="w-4 h-4 text-red-400" />
              }
              <span className={`text-sm font-medium ${gateway?.gateway_reachable ? 'text-emerald-600' : 'text-red-500'}`}>
                {gateway?.gateway_reachable ? 'Online & Reachable' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Gateway URL</p>
            <p className="text-sm font-mono text-slate-700 truncate">{gateway?.gateway_url ?? 'N/A'}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Active Agent</p>
            <p className="text-sm font-medium text-slate-700">{gateway?.active_agent ?? 'N/A'}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Active Model</p>
            <p className="text-sm font-mono text-slate-700 truncate">{gateway?.active_model ?? 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Available Models</h2>
        {models.length === 0 ? (
          <p className="text-xs text-slate-400">Tidak ada model tersedia.</p>
        ) : (
          <div className="space-y-1.5">
            {models.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-700">{m.name}</p>
                  <p className="text-[10px] font-mono text-slate-400">{m.id}</p>
                </div>
                {m.recommended && (
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                    Recommended
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
