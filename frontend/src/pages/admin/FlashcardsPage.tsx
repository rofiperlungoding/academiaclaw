import { useEffect, useState } from 'react';
import { Plus, Trash2, Search, Filter, X } from 'lucide-react';
import type { Flashcard } from '../../types';
import { api } from '../../api';

export function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [cardType, setCardType] = useState('Concept');

  const fetchCards = async () => {
    try {
      const data = await api.getFlashcards(false);
      setCards(data);
    } catch {
      setCards([]);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    try {
      await api.createFlashcard({
        question,
        answer,
        card_type: cardType.toLowerCase(),
      });
      setQuestion('');
      setAnswer('');
      setShowCreate(false);
      fetchCards();
    } catch {
      alert('Gagal membuat flashcard.');
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Hapus flashcard ini?')) return;
    try {
      await api.deleteFlashcard(cardId);
      fetchCards();
    } catch {
      alert('Gagal menghapus flashcard.');
    }
  };

  const filtered = cards.filter((c) => {
    const matchesSearch = c.question.toLowerCase().includes(search.toLowerCase()) || c.answer.toLowerCase().includes(search.toLowerCase());
    const matchesState = stateFilter === 'all' || c.state === parseInt(stateFilter);
    return matchesSearch && matchesState;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <span>FSRS-6 Flashcard Management</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
              Free Spaced Repetition Scheduler
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola bank memori flashcard, monitor metrik difficulty dan stability, serta atur active recall schedule.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kartu Baru</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pertanyaan atau konsep jawaban..."
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          >
            <option value="all">Semua Status FSRS</option>
            <option value="0">New (Belum Diuji)</option>
            <option value="1">Learning (Sedang Dipelajari)</option>
            <option value="2">Review (Memori Stabil)</option>
            <option value="3">Relearning (Lupa / Refresh)</option>
          </select>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3.5 animate-scale-in shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Tambah Flashcard Manual
            </h3>
            <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="text-xs font-medium text-slate-700 block mb-1">Pertanyaan / Konsep</label>
              <textarea
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Misal: Apa kompleksitas waktu rotasi pada AVL Tree?"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Tipe Kartu</label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              >
                <option value="Concept">Concept</option>
                <option value="Algorithm">Algorithm</option>
                <option value="Formula">Formula</option>
                <option value="Definition">Definition</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">Jawaban Penjelasan</label>
            <textarea
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Misal: O(1) karena rotasi hanya memodifikasi pointer child dan parent lokal pada subtree yang tidak seimbang."
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
            >
              Simpan Kartu
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-xs text-slate-400">
            Tidak ada flashcard yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          filtered.map((card) => {
            const dueDt = new Date(card.due);
            const isDue = dueDt <= new Date();

            return (
              <div
                key={card.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4.5 hover:shadow-card hover:border-slate-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-100 uppercase">
                        {card.card_type || 'Concept'}
                      </span>
                      {isDue && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
                          Due Today
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-900 leading-snug">{card.question}</p>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">{card.answer}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(card.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0 p-1"
                    title="Hapus flashcard"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 mt-3.5 pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                    Difficulty: {card.difficulty.toFixed(2)}
                  </span>
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                    Stability: {card.stability.toFixed(2)}d
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-semibold">
                    Retrievability: {Math.round(card.retrievability * 100)}%
                  </span>
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                    Reps: {card.reps}
                  </span>
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                    Lapses: {card.lapses}
                  </span>
                  <span className={`ml-auto px-2 py-0.5 rounded font-medium ${
                    card.state === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    card.state === 1 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    card.state === 2 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    State: {['New', 'Learning', 'Review', 'Relearning'][card.state]}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
