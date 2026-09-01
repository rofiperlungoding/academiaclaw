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
      text: 'Halo Rofi! Saya AcademiaClaw AI Copilot. Saya memiliki akses ke materi kuliah Anda, status retensi flashcard FSRS-6, dan agenda akademik terdekat. Silakan tanyakan konsep atau gunakan saran di bawah.',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Tanya AI Copilot</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">
              Academic Context Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Didukung OpenClaw Gateway dengan kurikulum FILKOM UB.
          </p>
        </div>

        <button
          onClick={handleClear}
          className="text-xs text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
          title="Bersihkan Percakapan"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Bersihkan</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/80 rounded-2xl border border-slate-200/90 p-4 space-y-3.5">
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="text-center my-2">
                <p className="inline-block text-xs text-slate-600 bg-white border border-slate-200/80 rounded-xl px-4 py-2 shadow-2xs max-w-lg leading-relaxed">
                  {msg.text}
                </p>
              </div>
            );
          }

          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isUser ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
              }`}>
                {isUser
                  ? <User className="w-4 h-4" />
                  : <Bot className="w-4 h-4 text-blue-600" />
                }
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                isUser
                  ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                  : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-card'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 font-mono ${isUser ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-3 shadow-card flex items-center gap-2.5 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Memproses konteks akademik dan menghasilkan jawaban...</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(p)}
              className="whitespace-nowrap text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors shadow-2xs flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
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
            className="flex-1 bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 shadow-xs"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs sm:text-sm font-medium transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
}
