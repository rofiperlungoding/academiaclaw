import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Settings2, Trash2 } from 'lucide-react';
import type { GatewayStatus, ModelItem } from '../../types';
import { api } from '../../api';

interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  model?: string;
}

export function AgentPage() {
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [contextMode, setContextMode] = useState('academic_tutor');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'system',
      text: 'OpenClaw Agent Terminal initialized. Direct gateway stream connected to port 18789.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.allSettled([api.getGatewayStatus(), api.getModels()]).then(([g, m]) => {
      if (g.status === 'fulfilled') {
        setGateway(g.value);
        setSelectedModel(g.value.active_model || '9router/oc/hy3-free');
      }
      if (m.status === 'fulfilled') {
        setModels(m.value);
      }
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
    setIsSending(true);

    try {
      const res = await api.chatWithAgent(text, 'admin_console', selectedModel, contextMode);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: res.reply,
          model: res.model,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'system',
          text: 'Error contacting OpenClaw Gateway. Check connection status.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'init',
        sender: 'system',
        text: 'Terminal session cleared.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <span>OpenClaw Agent Terminal</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Raw Console
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interaksi langsung dengan runtime agent OpenClaw menggunakan token otorisasi gateway.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={contextMode}
            onChange={(e) => setContextMode(e.target.value)}
            className="bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 font-mono shadow-2xs"
          >
            <option value="academic_tutor">Mode: Academic Tutor</option>
            <option value="exam_crammer">Mode: Active Recall Crammer</option>
            <option value="raw">Mode: Raw (No System Context)</option>
          </select>

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 font-mono shadow-2xs"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-slate-600 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-14rem)] bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
            <Settings2 className="w-3.5 h-3.5 text-slate-400" />
            <span>session: admin_console</span>
            <span className="text-slate-300">|</span>
            <span className="text-blue-600 font-semibold">{selectedModel.split('/').pop()}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${gateway?.gateway_reachable ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className="text-[11px] font-medium text-slate-600 font-mono">
              {gateway?.gateway_reachable ? 'Gateway Online' : 'Gateway Standby'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40 font-mono text-xs">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="text-center my-1.5">
                  <span className="text-[11px] text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1 shadow-2xs">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                  isUser ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
                }`}>
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`max-w-[85%] px-4 py-3 rounded-xl leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-card whitespace-pre-wrap'
                }`}>
                  <p>{msg.text}</p>
                  <div className={`flex items-center justify-between gap-4 mt-2 pt-1 border-t text-[10px] ${
                    isUser ? 'border-blue-500 text-blue-200' : 'border-slate-100 text-slate-400'
                  }`}>
                    <span>{msg.model || (isUser ? 'client' : 'openclaw')}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white border border-slate-200/90 rounded-xl rounded-tl-xs px-4 py-3 shadow-card flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>Streaming response from OpenClaw agent backend...</span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="p-3 bg-white border-t border-slate-200/80">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Kirim perintah atau query ke agent..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 font-mono"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Exec</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
