import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, ArrowRight, Check, X, Trophy, Sparkles, BookOpen } from 'lucide-react';
import type { Flashcard } from '../../types';
import { api } from '../../api';
import confetti from 'canvas-confetti';

const RATING_CONFIG = [
  { value: 1, label: 'Lupa', key: '1', color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300' },
  { value: 2, label: 'Sulit', key: '2', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:border-amber-300' },
  { value: 3, label: 'Ingat', key: '3', color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300' },
  { value: 4, label: 'Mudah', key: '4', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' },
];

export function ReviewPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<{ [key: number]: number }>({ 1: 0, 2: 0, 3: 0, 4: 0 });

  const fetchDueCards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getFlashcards(true);
      if (data.length === 0) {
        const allCards = await api.getFlashcards(false);
        setCards(allCards);
        if (allCards.length === 0) {
          setIsComplete(true);
        }
      } else {
        setCards(data);
      }
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDueCards();
  }, [fetchDueCards]);

  const currentCard = cards[currentIndex];

  const handleRate = useCallback(async (rating: number) => {
    if (!currentCard || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.submitReview(currentCard.id, rating);
      setReviewedCount((c) => c + 1);
      setRatingCounts((prev) => ({ ...prev, [rating]: (prev[rating] || 0) + 1 }));

      if (currentIndex + 1 >= cards.length) {
        setIsComplete(true);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
      } else {
        setCurrentIndex((i) => i + 1);
        setIsFlipped(false);
      }
    } catch {
      alert('Gagal mengirim review.');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentCard, isSubmitting, currentIndex, cards.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete || loading || !currentCard) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComplete, loading, currentCard, isFlipped, handleRate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Menyiapkan kartu FSRS-6...</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-scale-in max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 shadow-sm">
          <Trophy className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-1 tracking-tight">
          Sesi Review Selesai
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {reviewedCount > 0
            ? `Bagus! Anda telah menyelesaikan review ${reviewedCount} kartu. Algoritma FSRS-6 telah memperbarui interval ingatan Anda.`
            : 'Saat ini belum ada kartu yang jatuh tempo. Semua konsep tersimpan optimal.'}
        </p>

        {reviewedCount > 0 && (
          <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 mb-6 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-left">
              Ringkasan Evaluasi
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-red-50 p-2 rounded-xl border border-red-100">
                <p className="text-base font-semibold text-red-600">{ratingCounts[1] || 0}</p>
                <p className="text-[10px] text-red-700 font-medium">Lupa</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                <p className="text-base font-semibold text-amber-600">{ratingCounts[2] || 0}</p>
                <p className="text-[10px] text-amber-700 font-medium">Sulit</p>
              </div>
              <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                <p className="text-base font-semibold text-blue-600">{ratingCounts[3] || 0}</p>
                <p className="text-[10px] text-blue-700 font-medium">Ingat</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                <p className="text-base font-semibold text-emerald-600">{ratingCounts[4] || 0}</p>
                <p className="text-[10px] text-emerald-700 font-medium">Mudah</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={() => navigate('/app')}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Ke Beranda
          </button>
          <button
            onClick={() => {
              setIsComplete(false);
              setCurrentIndex(0);
              setReviewedCount(0);
              setRatingCounts({ 1: 0, 2: 0, 3: 0, 4: 0 });
              fetchDueCards();
            }}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ulangi Sesi</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            Active Recall Review
          </h1>
          <p className="text-xs text-slate-400">Tekan Space untuk membuka jawaban.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/60 font-mono">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      <div
        className="perspective-1000 cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full min-h-[300px] transform-style-3d transition-transform duration-500 ease-out ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          <div className="absolute inset-0 backface-hidden bg-white border border-slate-200/90 rounded-2xl p-8 flex flex-col justify-between shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                Pertanyaan
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                {currentCard.card_type || 'Concept'}
              </span>
            </div>

            <div className="py-6">
              <p className="text-lg text-center font-medium text-slate-900 leading-relaxed">
                {currentCard.question}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
              <span>Klik kartu atau tekan</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10px] font-mono text-slate-600">Space</kbd>
              <span>untuk melihat jawaban</span>
            </div>
          </div>

          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border border-blue-200 rounded-2xl p-8 flex flex-col justify-between shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-widest text-blue-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Jawaban
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                {currentCard.card_type || 'Concept'}
              </span>
            </div>

            <div className="py-6">
              <p className="text-base text-center text-slate-800 leading-relaxed whitespace-pre-wrap">
                {currentCard.answer}
              </p>
            </div>

            <div className="text-center text-xs text-slate-400">
              Pilih tingkat pemahaman di bawah ini
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-xl px-4 py-2 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-mono">Difficulty: {currentCard.difficulty.toFixed(1)}</span>
          <span className="text-slate-300">&middot;</span>
          <span className="font-mono">Stability: {currentCard.stability.toFixed(1)}d</span>
          <span className="text-slate-300">&middot;</span>
          <span className="font-mono">R: {Math.round(currentCard.retrievability * 100)}%</span>
        </div>
        <span className="text-[10px] text-slate-400">FSRS-6 State: {['New', 'Learning', 'Review', 'Relearning'][currentCard.state]}</span>
      </div>

      {isFlipped ? (
        <div className="space-y-2 animate-fade-in">
          <p className="text-xs text-center text-slate-500">
            Seberapa mudah Anda mengingat konsep ini? (Shortcut: 1-4)
          </p>
          <div className="grid grid-cols-4 gap-2.5">
            {RATING_CONFIG.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRate(r.value)}
                disabled={isSubmitting}
                className={`py-3 rounded-xl border text-xs font-medium transition-all duration-200 disabled:opacity-50 flex flex-col items-center gap-1 shadow-xs ${r.color}`}
              >
                <div className="flex items-center gap-1">
                  {r.value === 1 && <X className="w-3.5 h-3.5" />}
                  {r.value === 4 && <Check className="w-3.5 h-3.5" />}
                  <span>{r.label}</span>
                </div>
                <kbd className="text-[10px] font-mono opacity-60 bg-black/5 px-1.5 py-0.2 rounded">
                  [{r.key}]
                </kbd>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsFlipped(true)}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <span>Tampilkan Jawaban</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
