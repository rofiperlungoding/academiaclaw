import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../api';

interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
}

const WELCOME =
  'I can see the material you uploaded, your FSRS-6 retention, and your deadlines. Ask me anything.';

const QUICK_PROMPTS = [
  'Summarise what I just uploaded',
  'Explain the concept I forget most often',
  'Which deadline is most urgent?',
  'Give me 5 practice questions from my latest material',
];

const newId = () => Math.random().toString(36).slice(2);

export function AskPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', sender: 'system', text: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

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
      const res = await api.chatWithAgent(body, 'user_session', undefined, 'academic_tutor');
      setMessages((prev) => [...prev, { id: newId(), sender: 'agent', text: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          sender: 'system',
          text: 'Lost connection to the OpenClaw Gateway. Try again shortly.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const clear = () => {
    if (!confirm('Clear this conversation?')) return;
    setMessages([{ id: 'welcome', sender: 'system', text: WELCOME }]);
  };

  const showQuickPrompts = messages.length === 1;

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)] animate-fade-in">
      <header className="flex items-baseline justify-between pb-4 border-b border-zinc-100">
        <div>
          <h1 className="page-title">Ask AI</h1>
          <p className="mt-0.5 text-xs text-zinc-400">
            Answered from your knowledge graph via the OpenClaw Gateway
          </p>
        </div>
        <button onClick={clear} className="btn-ghost btn-sm" title="Clear conversation">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.map((msg) =>
          msg.sender === 'system' ? (
            <p key={msg.id} className="text-[13px] leading-relaxed text-zinc-400 max-w-prose">
              {msg.text}
            </p>
          ) : (
            <div key={msg.id} className="animate-fade-in">
              <p className="eyebrow mb-1.5">{msg.sender === 'user' ? 'You' : 'AcademiaClaw'}</p>
              <p
                className={`text-[14px] leading-relaxed whitespace-pre-wrap max-w-prose ${
                  msg.sender === 'user' ? 'text-zinc-900 font-medium' : 'text-zinc-700'
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
            Working through your material…
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="pt-3 border-t border-zinc-100 space-y-3">
        {showQuickPrompts && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="shrink-0 h-7 px-2.5 rounded-md border border-zinc-200 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your material or tasks…"
            className="input-field flex-1"
            aria-label="Question"
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
    </div>
  );
}
