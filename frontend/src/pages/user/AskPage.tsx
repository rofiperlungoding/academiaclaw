import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
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
      text: 'Hai! Aku AcademiaClaw AI, siap bantu kamu belajar. Tanyakan apapun tentang materi kuliahmu, atau gunakan shortcut di bawah.',
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
      const res = await api.chatWithAgent(text);
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
        text: 'Gagal menghubungi agent. Coba lagi nanti.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    'Rangkum materi yang sudah diupload',
    'Uji pemahaman saya dengan 3 pertanyaan',
    'Apa deadline yang paling mendesak?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Tanya AI</h1>
        <p className="text-xs text-slate-500 mt-0.5">Terhubung ke AcademiaClaw Agent via OpenClaw Gateway.</p>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="text-center">
                <p className="inline-block text-xs text-slate-500 bg-white border border-slate-100 rounded-xl px-3 py-1.5">
                  {msg.text}
                </p>
              </div>
            );
          }

          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                isUser ? 'bg-blue-500' : 'bg-slate-200'
              }`}>
                {isUser
                  ? <User className="w-3.5 h-3.5 text-white" />
                  : <Bot className="w-3.5 h-3.5 text-slate-600" />
                }
              </div>
              <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isUser
                  ? 'bg-blue-500 text-white rounded-tr-md'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-md shadow-card'
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-slate-200 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-card flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              Berpikir...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(p)}
              className="whitespace-nowrap text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pertanyaan..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-medium transition-colors shadow-sm shadow-blue-200 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
