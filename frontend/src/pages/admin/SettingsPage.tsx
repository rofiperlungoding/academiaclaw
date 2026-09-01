import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Server, Activity, FileCode, CheckCircle2 } from 'lucide-react';
import type { GatewayStatus, ModelItem } from '../../types';
import { api } from '../../api';

export function SettingsPage() {
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [selectedPrompt, setSelectedPrompt] = useState<string>('SOUL.md');
  const [pingResult, setPingResult] = useState<{ success: boolean; latency_ms: number; status_code?: number } | null>(null);
  const [pinging, setPinging] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.getGatewayStatus(),
      api.getModels(),
      api.getPrompts(),
    ]).then(([g, m, p]) => {
      if (g.status === 'fulfilled') setGateway(g.value);
      if (m.status === 'fulfilled') setModels(m.value);
      if (p.status === 'fulfilled') setPrompts(p.value);
    });
  }, []);

  const handleTestPing = async () => {
    setPinging(true);
    try {
      const res = await api.pingGateway();
      setPingResult(res);
    } catch {
      setPingResult({ success: false, latency_ms: 0 });
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <span>System Settings & Architecture</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              OpenClaw Ecosystem
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi konektivitas OpenClaw Gateway, inspeksi prompt workspace, dan model routing.
          </p>
        </div>

        <button
          onClick={handleTestPing}
          disabled={pinging}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
        >
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span>{pinging ? 'Testing Gateway...' : 'Ping Gateway'}</span>
        </button>
      </div>

      {pingResult && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between animate-scale-in ${
          pingResult.success
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-red-50/80 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2">
            {pingResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="font-medium">
              {pingResult.success
                ? `Gateway Online - Respons diterima dalam ${pingResult.latency_ms} ms (HTTP ${pingResult.status_code})`
                : 'Gateway Offline atau Timeout'}
            </span>
          </div>
          <span className="font-mono text-[10px]">
            Target: {gateway?.gateway_url || 'http://103.30.146.109:18789'}
          </span>
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          <span>OpenClaw Gateway Specifications</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
            <p className="text-[10px] text-slate-400 font-mono uppercase mb-1">Status Koneksi</p>
            <div className="flex items-center gap-2">
              {gateway?.gateway_reachable ? (
                <Wifi className="w-4 h-4 text-emerald-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-xs font-semibold ${gateway?.gateway_reachable ? 'text-emerald-700' : 'text-red-600'}`}>
                {gateway?.gateway_reachable ? 'Reachable & Online' : 'Standby / Offline'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
            <p className="text-[10px] text-slate-400 font-mono uppercase mb-1">Gateway Endpoint</p>
            <p className="text-xs font-mono text-slate-800 font-medium truncate">
              {gateway?.gateway_url || 'http://103.30.146.109:18789'}
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
            <p className="text-[10px] text-slate-400 font-mono uppercase mb-1">Default Active Agent</p>
            <p className="text-xs text-slate-800 font-medium truncate">
              {gateway?.active_agent || 'main'}
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
            <p className="text-[10px] text-slate-400 font-mono uppercase mb-1">Primary LLM Model</p>
            <p className="text-xs font-mono text-slate-800 font-medium truncate">
              {gateway?.active_model || '9router/oc/hy3-free'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-600" />
              <span>OpenClaw Workspace Prompt Configuration</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              File kepribadian, agent profile, heartbeat cron, dan tools yang disinkronkan ke OpenClaw workspace.
            </p>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {['SOUL.md', 'AGENTS.md', 'HEARTBEAT.md', 'TOOLS.md'].map((filename) => (
              <button
                key={filename}
                onClick={() => setSelectedPrompt(filename)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                  selectedPrompt === filename
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filename}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs max-h-72 overflow-y-auto leading-relaxed shadow-inner">
          <pre className="whitespace-pre-wrap">
            {prompts[selectedPrompt] || 'Memuat konten file prompt...'}
          </pre>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900">
          Available AI LLM Models (OpenRouter & 9Router)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {models.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100"
            >
              <div>
                <p className="text-xs font-medium text-slate-800">{m.name}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">{m.id}</p>
              </div>
              {m.recommended && (
                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-mono">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
