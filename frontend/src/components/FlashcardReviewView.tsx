import React, { useState } from 'react';
import {
  Brain,
  Plus,
  RotateCw,
  CheckCircle2,
  Trash2,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Flashcard, RetentionStats } from '../types';
import { api } from '../api';

interface FlashcardReviewViewProps {
  cards: Flashcard[];
  stats: RetentionStats | null;
  onRefresh: () => void;
}

export const FlashcardReviewView: React.FC<FlashcardReviewViewProps> = ({
  cards,
  onRefresh,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [newAnswer, setNewAnswer] = useState<string>('');

  const now = new Date();
  const dueCards = cards.filter((c) => new Date(c.due) <= now);
  const activeDeck = dueCards.length > 0 ? dueCards : cards;
  const currentCard = activeDeck[currentIndex] || null;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (rating: number) => {
    if (!currentCard || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await api.submitReview(currentCard.id, rating);
      setIsFlipped(false);

      if (currentIndex >= activeDeck.length - 1) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        setCurrentIndex(0);
      } else {
        setCurrentIndex((i) => i + 1);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Review failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    try {
      await api.createFlashcard({ question: newQuestion, answer: newAnswer });
      setNewQuestion('');
      setNewAnswer('');
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create flashcard');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Hapus kartu kuis ini?')) return;
    try {
      await api.deleteFlashcard(cardId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            FSRS-6 Active Recall Scheduler
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Algoritma Free Spaced Repetition Scheduler versi 6 mengoptimalkan interval belajar berdasarkan Difficulty, Stability, dan Retrievability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            Tambah Kartu Manual
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col items-center justify-center">
          {activeDeck.length === 0 ? (
            <div className="w-full py-16 px-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-100">Semua Review Selesai!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Tidak ada kartu kuis FSRS-6 yang jatuh tempo hari ini. Upload materi perkuliahan baru atau istirahat untuk memantapkan retensi ingatan.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                <span>
                  Kartu {currentIndex + 1} dari {activeDeck.length} ({dueCards.length > 0 ? 'Due Queue' : 'All Cards'})
                </span>
                <span className="text-emerald-400 font-semibold">
                  Retrievability: {Math.round((currentCard?.retrievability ?? 1) * 100)}%
                </span>
              </div>

              <div
                onClick={handleFlip}
                className="w-full h-72 rounded-2xl cursor-pointer bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-2xl relative select-none"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {isFlipped ? 'JAWABAN / KONSEP' : 'PERTANYAAN RECALL'}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Klik kartu untuk membalik</span>
                  </div>
                </div>

                <div className="my-auto text-center px-4">
                  {isFlipped ? (
                    <div className="text-base font-medium text-slate-100 leading-relaxed animate-in fade-in duration-200">
                      {currentCard?.answer}
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-slate-100 leading-relaxed animate-in fade-in duration-200">
                      {currentCard?.question}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-3 border-t border-slate-800/80">
                  <span>D: {currentCard?.difficulty?.toFixed(1) || '0.0'}</span>
                  <span>S: {currentCard?.stability?.toFixed(1) || '0.0'} hari</span>
                  <span>Reps: {currentCard?.reps || 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                <button
                  onClick={() => handleReview(1)}
                  disabled={isSubmitting}
                  className="flex flex-col items-center py-2.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="text-xs font-bold">1. Again</span>
                  <span className="text-[10px] font-mono opacity-80">&lt;10m</span>
                </button>

                <button
                  onClick={() => handleReview(2)}
                  disabled={isSubmitting}
                  className="flex flex-col items-center py-2.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="text-xs font-bold">2. Hard</span>
                  <span className="text-[10px] font-mono opacity-80">1-2d</span>
                </button>

                <button
                  onClick={() => handleReview(3)}
                  disabled={isSubmitting}
                  className="flex flex-col items-center py-2.5 px-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="text-xs font-bold">3. Good</span>
                  <span className="text-[10px] font-mono opacity-80">3-5d</span>
                </button>

                <button
                  onClick={() => handleReview(4)}
                  disabled={isSubmitting}
                  className="flex flex-col items-center py-2.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="text-xs font-bold">4. Easy</span>
                  <span className="text-[10px] font-mono opacity-80">7-14d</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              DSR Model Analytics
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Difficulty (D)</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">
                  Tingkat kerumitan intrinsik materi (skala 1-10).
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Stability (S)</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">
                  Jumlah hari retensi bertahan di atas ambang target 90%.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Retrievability (R)</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  Probabilitas mengingat kembali informasi saat ini.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between mb-3">
              <span>Deck Inventory ({cards.length})</span>
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {cards.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex-1 line-clamp-1 text-slate-200">{c.question}</div>
                  <button
                    onClick={() => handleDeleteCard(c.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-100 mb-4">Tambah Flashcard Manual</h3>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Pertanyaan Recall
                </label>
                <textarea
                  rows={2}
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Misal: Apa keunggulan FSRS-6 dibanding SM-2?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Jawaban Singkat
                </label>
                <textarea
                  rows={3}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Jawaban kunci..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 shadow-md shadow-blue-600/30"
                >
                  Simpan Kartu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
