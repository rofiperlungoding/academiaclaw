import { useEffect, useState } from 'react';
import { Plus, Trash2, Search, X } from 'lucide-react';
import type { Flashcard } from '../../types';
import { api } from '../../api';
import { EmptyFlashcards } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';

const STATES = ['New', 'Learning', 'Review', 'Relearning'];
const CARD_TYPES = ['concept', 'algorithm', 'formula', 'definition'];

export function FlashcardsPage() {
  const { success, error } = useToast();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [cardType, setCardType] = useState('concept');

  const fetchCards = async () => {
    try {
      setCards(await api.getFlashcards(false));
    } catch {
      setCards([]);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    try {
      await api.createFlashcard({
        question: question.trim(),
        answer: answer.trim(),
        card_type: cardType,
      });
      success('Flashcard created.');
      setQuestion('');
      setAnswer('');
      setShowCreate(false);
      fetchCards();
    } catch {
      error('Could not create the flashcard.');
    }
  };

  const remove = async (cardId: string) => {
    if (!confirm('Delete this flashcard?')) return;
    try {
      await api.deleteFlashcard(cardId);
      fetchCards();
    } catch {
      error('Could not delete the flashcard.');
    }
  };

  const q = search.toLowerCase();
  const filtered = cards.filter(
    (c) =>
      (c.question.toLowerCase().includes(q) || c.answer.toLowerCase().includes(q)) &&
      (stateFilter === 'all' || c.state === Number(stateFilter))
  );

  return (
    <div className="animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Flashcards</h1>
          <p className="mt-1 muted max-w-lg">
            FSRS-6 memory bank with per-card difficulty, stability, and retrievability.
          </p>
        </div>
        <button onClick={() => setShowCreate((v) => !v)} className="btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5" />
          New card
        </button>
      </header>

      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or answers…"
            className="input-field pl-8"
            aria-label="Search flashcards"
          />
        </div>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="input-field sm:w-44"
          aria-label="Filter by FSRS state"
        >
          <option value="all">All states</option>
          {STATES.map((s, i) => (
            <option key={s} value={i}>{s}</option>
          ))}
        </select>
      </div>

      {showCreate && (
        <form onSubmit={create} className="mt-6 card p-5 space-y-4 animate-pop-in">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Add a card manually</h2>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="btn-ghost btn-sm"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-3">
              <label className="label" htmlFor="fc-q">Question</label>
              <textarea
                id="fc-q"
                rows={2}
                className="input-field"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What is the time complexity of an AVL tree rotation?"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="fc-type">Type</label>
              <select
                id="fc-type"
                className="input-field"
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
              >
                {CARD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="fc-a">Answer</label>
            <textarea
              id="fc-a"
              rows={3}
              className="input-field"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="O(1) - a rotation only rewires local subtree pointers."
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      )}

      <div className="mt-8">
        {filtered.length === 0 ? (
          cards.length === 0 ? (
            <EmptyFlashcards />
          ) : (
            <p className="py-14 text-center text-[13px] text-zinc-400 border-t border-zinc-100">
              No matching cards.
            </p>
          )
        ) : (
          <div className="list border-t border-zinc-100">
            {filtered.map((card) => {
              const isDue = new Date(card.due) <= new Date();
              return (
                <article key={card.id} className="py-4 group">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium leading-snug text-zinc-900">
                        {card.question}
                      </p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500 line-clamp-2">
                        {card.answer}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(card.id)}
                      className="shrink-0 text-zinc-200 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      aria-label="Delete flashcard"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-zinc-400">
                    <span>{card.card_type || 'concept'}</span>
                    <span>D {card.difficulty.toFixed(2)}</span>
                    <span>S {card.stability.toFixed(2)}d</span>
                    <span>R {Math.round(card.retrievability * 100)}%</span>
                    <span>{card.reps} reps</span>
                    <span>{card.lapses} lapses</span>
                    <span className="text-zinc-500">{STATES[card.state] ?? 'New'}</span>
                    {isDue && <span className="text-red-600">due</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
