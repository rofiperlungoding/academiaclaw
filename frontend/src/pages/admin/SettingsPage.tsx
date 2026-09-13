import { useEffect, useState } from 'react';
import type { GatewayStatus, ModelItem } from '../../types';
import { api } from '../../api';

const PROMPT_FILES = ['SOUL.md', 'AGENTS.md', 'HEARTBEAT.md', 'TOOLS.md'];

interface PingResult {
  success: boolean;
  latency_ms: number;
  status_code?: number;
}

export function SettingsPage() {
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [selectedPrompt, setSelectedPrompt] = useState('SOUL.md');
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [pinging, setPinging] = useState(false);

  useEffect(() => {
    Promise.allSettled([api.getGatewayStatus(), api.getModels(), api.getPrompts()]).then(
      ([g, m, p]) => {
        if (g.status === 'fulfilled') setGateway(g.value);
        if (m.status === 'fulfilled') setModels(m.value);
        if (p.status === 'fulfilled') setPrompts(p.value);
      }
    );
  }, []);

  const ping = async () => {
    setPinging(true);
    try {
      setPingResult(await api.pingGateway());
    } catch {
      setPingResult({ success: false, latency_ms: 0 });
    } finally {
      setPinging(false);
    }
  };

  const specs = [
    ['Status', gateway?.gateway_reachable ? 'Reachable' : 'Offline'],
    ['Endpoint', gateway?.gateway_url ?? '—'],
    ['Default agent', gateway?.active_agent ?? '—'],
    ['Primary model', gateway?.active_model ?? '—'],
  ];

  return (
    <div className="animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="mt-1 muted">Gateway connectivity, workspace prompts, and model routing.</p>
        </div>
        <button onClick={ping} disabled={pinging} className="btn-secondary btn-sm">
          {pinging ? 'Testing…' : 'Ping gateway'}
        </button>
      </header>

      {pingResult && (
        <p
          role="status"
          className={`mt-5 text-[13px] animate-fade-in ${
            pingResult.success ? 'text-emerald-700' : 'text-red-600'
          }`}
        >
          {pingResult.success
            ? `Gateway online · ${pingResult.latency_ms} ms · HTTP ${pingResult.status_code}`
            : 'Gateway offline or timed out.'}
        </p>
      )}

      <section className="mt-9">
        <h2 className="section-title">Gateway</h2>
        <dl className="mt-3 list border-t border-zinc-100">
          {specs.map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-4 py-2.5">
              <dt className="w-32 shrink-0 text-xs text-zinc-400">{k}</dt>
              <dd className="text-[13px] text-zinc-800 truncate">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Workspace prompts</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Persona, agent profile, heartbeat cron, and tool declarations.
            </p>
          </div>
          <div className="flex gap-0.5">
            {PROMPT_FILES.map((filename) => (
              <button
                key={filename}
                onClick={() => setSelectedPrompt(filename)}
                className={`h-7 px-2 rounded-md text-[11px] font-medium transition-colors ${
                  selectedPrompt === filename
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {filename}
              </button>
            ))}
          </div>
        </div>

        <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-zinc-900 p-4 text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
          {prompts[selectedPrompt] || 'Loading prompt file…'}
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="section-title">Available models</h2>
        <div className="mt-3 list border-t border-zinc-100">
          {models.length === 0 ? (
            <p className="py-4 text-[13px] text-zinc-400">No models registered.</p>
          ) : (
            models.map((m) => (
              <div key={m.id} className="flex items-baseline gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-zinc-900 truncate">{m.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-400 truncate">{m.id}</p>
                </div>
                {m.recommended && <span className="badge-neutral shrink-0">default</span>}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
