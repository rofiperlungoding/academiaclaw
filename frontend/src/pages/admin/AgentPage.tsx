import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2, Trash2 } from 'lucide-react';
import type { GatewayStatus, ModelItem } from '../../types';
import { api } from '../../api';

interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  model?: string;
}

const CONTEXT_MODES = [
  { value: 'academic_tutor', label: 'Academic tutor' },
  { value: 'exam_crammer', label: 'Active recall crammer' },
  { value: 'raw', label: 'Raw (no system context)' },
];

const newId = () => Math.random().toString(36).slice(2);

export function AgentPage() {
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [contextMode, setContextMode] = useState('academic_tutor');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', sender: 'system', text: 'Terminal ready. Gateway stream on port 18789.' },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.allSettled([api.getGatewayStatus(), api.getModels()]).then(([g, m]) => {
      if (g.status === 'fulfilled') {
        setGateway(g.value);
        setSelectedModel(g.value.active_model || '');
      }
      if (m.status === 'fulfilled') setModels(m.value);
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const sendMessage = async (text: string) => {
    const body = text.trim();
    if (!body || isSending) return;

    setMessages((prev) => [...prev, { id: newId(), sender: 'user', text: body }]);
    setInput('');
    setIsSending(true);

    try {
      const res = await api.chatWithAgent(body, 'admin_console', selectedModel, contextMode);
      setMessages((prev) => [
        ...prev,
        { id: newId(), sender: 'agent', text: res.reply, model: res.model },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: newId(), sender: 'system', text: 'Could not reach the OpenClaw Gateway.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Agent</h1>
          <p className="mt-1 muted">Direct console into the OpenClaw runtime.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={contextMode}
            onChange={(e) => setContextMode(e.target.value)}
            className="input-field w-auto"
            aria-label="Context mode"
          >
            {CONTEXT_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="input-field w-auto max-w-[200px]"
            aria-label="Model"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button
            onClick={() =>
              setMessages([{ id: 'init', sender: 'system', text: 'Terminal session cleared.' }])
            }
            className="btn-ghost btn-sm"
            title="Clear console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="mt-6 flex items-center gap-3 pb-3 border-b border-zinc-100 text-[11px] text-zinc-400">
        <span>session admin_console</span>
        <span className="text-zinc-700">{selectedModel.split('/').pop() || '—'}</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              gateway?.gateway_reachable ? 'bg-emerald-500' : 'bg-zinc-300'
            }`}
          />
          {gateway?.gateway_reachable ? 'online' : 'standby'}
        </span>
      </div>

      <div className="h-[calc(100vh-20rem)] min-h-[320px] overflow-y-auto py-5 space-y-5">
        {messages.map((msg) =>
          msg.sender === 'system' ? (
            <p key={msg.id} className="text-[13px] text-zinc-400">{msg.text}</p>
          ) : (
            <div key={msg.id} className="animate-fade-in">
              <p className="eyebrow mb-1.5">
                {msg.sender === 'user' ? 'admin' : msg.model || 'openclaw'}
              </p>
              <p
                className={`text-[13px] leading-relaxed whitespace-pre-wrap max-w-prose ${
                  msg.sender === 'user' ? 'font-medium text-zinc-900' : 'text-zinc-700'
                }`}
              >
                {msg.text}
              </p>
            </div>
          )
        )}

        {isSending && (
          <div className="flex items-center gap-2 text-[13px] text-zinc-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Waiting for the agent…
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2 pt-3 border-t border-zinc-100"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a command to the agent…"
          className="input-field flex-1"
          aria-label="Agent command"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="btn-primary w-9 px-0 shrink-0"
          aria-label="Send"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
