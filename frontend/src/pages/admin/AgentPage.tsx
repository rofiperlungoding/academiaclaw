import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Settings2 } from 'lucide-react';
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
      text: 'Agent Terminal initialized. Full OpenClaw Gateway access enabled.',
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
        setSelectedModel(g.value.active_model || '');
      }
      if (m.status === 'fulfilled') setModels(m.value);
    });
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;
    setMessages((prev) => [...prev, {
      id: Date.now().toString(), sender: 'user', text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setInput('');
    setIsSending(true);
    try {
      const res = await api.chatWithAgent(text, 'admin', selectedModel, contextMode);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(), sender: 'agent', text: res.reply, model: res.model,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(), sender: 'system', text: 'Error contacting gateway.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Agent Terminal</h1>
          <p className="text-xs text-slate-500 mt-0.5">Direct OpenClaw Gateway interaction.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={contextMode} onChange={(e) => setContextMode(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 font-mono">
            <option value="academic_tutor">Academic Tutor</option>
            <option value="exam_crammer">Active Recall</option>
            <option value="raw">Raw</option>
          </select>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 font-mono">
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-14rem)] bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Settings2 className="w-3.5 h-3.5" />
            <span>session: admin</span>
            <span className="text-slate-300">|</span>
            <span>model: {selectedModel.split('/').pop()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${gateway?.gateway_reachable ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            <span className="text-[10px] font-medium text-slate-500">
              {gateway?.gateway_reachable ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="text-center">
                  <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 font-mono">
                    {msg.text}
                  </span>
                </div>
              );
            }
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser ? 'bg-blue-500' : 'bg-slate-800'
                }`}>
                  {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-500 text-white rounded-tr-md'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-md font-mono text-xs whitespace-pre-wrap'
                }`}>
                  {msg.text}
                  {msg.model && (
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">{msg.model}</p>
                  )}
                </div>
              </div>
            );
          })}
          {isSending && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-md px-3.5 py-2.5 flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                Processing...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Instruksi ke agent..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 font-mono" />
            <button type="submit" disabled={isSending || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-medium transition-colors flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
