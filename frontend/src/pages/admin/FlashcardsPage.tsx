import { useEffect, useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import type { Flashcard } from '../../types';
import { api } from '../../api';

export function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const fetchCards = async () => {
    try { setCards(await api.getFlashcards(false)); } catch { setCards([]); }
  };

  useEffect(() => { fetchCards(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    try {
      await api.createFlashcard({ question, answer });
      setQuestion(''); setAnswer('');
      setShowCreate(false);
      fetchCards();
    } catch {
      alert('Gagal membuat flashcard');
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Hapus flashcard ini?')) return;
    try {
      await api.deleteFlashcard(cardId);
      fetchCards();
    } catch {
      alert('Gagal menghapus');
    }
  };

  const filtered = cards.filter((c) =>
    c.question.toLowerCase().includes(search.toLowerCase()) ||
    c.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Flashcard Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">CRUD dan monitoring semua flashcard FSRS-6.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors shadow-sm shadow-blue-200"
        >
          <Plus className="w-3.5 h-3.5" />
          Buat Kartu
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 animate-scale-in">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Pertanyaan</label>
            <textarea rows={2} value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="Apa itu Binary Search Tree?"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Jawaban</label>
            <textarea rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)}
              placeholder="BST adalah struktur data tree dimana..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button type="submit"
              className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200">
              Simpan
            </button>
          </div>
        </form>
      )}

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari flashcard..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Tidak ada flashcard ditemukan.</p>
        ) : (
          filtered.map((card) => (
            <div key={card.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-card transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{card.question}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{card.answer}</p>
                </div>
                <button onClick={() => handleDelete(card.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors shrink-0 mt-0.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-slate-50">D:{card.difficulty.toFixed(1)}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-50">S:{card.stability.toFixed(1)}</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-500">R:{Math.round(card.retrievability * 100)}%</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-50">Reps:{card.reps}</span>
                <span className={`px-1.5 py-0.5 rounded ${
                  card.state === 0 ? 'bg-emerald-50 text-emerald-600' :
                  card.state === 1 ? 'bg-amber-50 text-amber-600' :
                  card.state === 2 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                }`}>
                  {['New', 'Learning', 'Review', 'Relearning'][card.state]}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
