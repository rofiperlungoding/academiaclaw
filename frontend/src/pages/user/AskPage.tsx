import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Trash2, Sparkles } from 'lucide-react';
import { api } from '../../api';

interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
}

export function AskPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'system',
      text: 'Halo! Saya AcademiaClaw AI Copilot. Saya memiliki akses ke materi kuliah Anda, status retensi flashcard FSRS-6, dan agenda akademik terdekat. Silakan tanyakan konsep atau gunakan saran di bawah.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const res = await api.chatWithAgent(text, 'user_session', undefined, 'academic_tutor');
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: 'Koneksi ke OpenClaw Gateway terputus atau backend sedang sibuk. Silakan coba sesaat lagi.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    if (!confirm('Hapus riwayat percakapan ini?')) return;
    setMessages([
      {
        id: 'welcome',
        sender: 'system',
        text: 'Riwayat dibersihkan. Silakan tanyakan hal baru.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    'Jelaskan perbedaan AVL Tree vs Red-Black Tree',
    'Apa syarat bentuk normal ke-3 (3NF) dalam Basis Data?',
    'Bagaimana cara kerja Booth Algorithm perkalian biner?',
    'Rangkumkan deadline kuliah yang paling mendesak',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] animate-fade-in space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <span>Tanya AI Copilot</span>
            <span className="badge-brand text-[10px] font-mono">
              Academic Context Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Didukung OpenClaw Gateway dengan kurikulum FILKOM UB.
          </p>
        </div>

        <button
          onClick={handleClear}
          className="btn-ghost text-xs"
          title="Bersihkan Percakapan"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Bersihkan</span>
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-surface-100/50 rounded-2xl border border-slate-200/80 p-4 space-y-3.5">
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="text-center my-2">
                <p className="inline-block text-xs text-slate-600 bg-white border border-slate-200/80 rounded-xl px-4 py-2 shadow-xs max-w-lg leading-relaxed">
                  {msg.text}
                </p>
              </div>
            );
          }

          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isUser
                  ? 'bg-gradient-to-br from-brand-600 to-violet-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}>
                {isUser
                  ? <User className="w-4 h-4" />
                  : <Bot className="w-4 h-4 text-brand-600" />
                }
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                isUser
                  ? 'bg-gradient-to-br from-brand-600 to-violet-600 text-white rounded-tr-md shadow-xs'
                  : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-md shadow-card'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 font-mono ${isUser ? 'text-white/40 text-right' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4 text-brand-600" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-md px-4 py-3 shadow-card flex items-center gap-2.5 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
              <span>Memproses konteks akademik...</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Quick prompts + Input */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(p)}
              className="whitespace-nowrap text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3 h-3 text-brand-500 shrink-0" />
              <span>{p}</span>
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan materi perkuliahan atau tugas..."
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="btn-primary px-4 py-2.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
}
