import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, ArrowRight, Check, X, Trophy } from 'lucide-react';
import type { Flashcard } from '../../types';
import { api } from '../../api';
import confetti from 'canvas-confetti';

const RATING_CONFIG = [
  { value: 1, label: 'Lupa', color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' },
  { value: 2, label: 'Sulit', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
  { value: 3, label: 'Ingat', color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
  { value: 4, label: 'Mudah', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' },
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

  const fetchDueCards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getFlashcards(true);
      setCards(data);
      if (data.length === 0) setIsComplete(true);
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

  const handleRate = async (rating: number) => {
    if (!currentCard || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.submitReview(currentCard.id, rating);
      setReviewedCount((c) => c + 1);

      if (currentIndex + 1 >= cards.length) {
        setIsComplete(true);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
      } else {
        setCurrentIndex((i) => i + 1);
        setIsFlipped(false);
      }
    } catch {
      alert('Gagal mengirim review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-scale-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
          <Trophy className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Sesi Review Selesai</h2>
        <p className="text-sm text-slate-500 mb-6">
          {reviewedCount > 0
            ? `Kamu sudah me-review ${reviewedCount} kartu. Retensimu akan meningkat.`
            : 'Tidak ada kartu yang perlu di-review saat ini.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/app')}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Kembali ke Beranda
          </button>
          <button
            onClick={() => {
              setIsComplete(false);
              setCurrentIndex(0);
              setReviewedCount(0);
              fetchDueCards();
            }}
            className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Review Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Active Recall Review</h1>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      <div
        className="perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full min-h-[280px] transform-style-3d transition-transform duration-500 ease-out ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center shadow-card">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-4">Pertanyaan</span>
            <p className="text-lg text-center font-medium text-slate-800 leading-relaxed">
              {currentCard.question}
            </p>
            <p className="text-xs text-slate-400 mt-6 flex items-center gap-1">
              Tap untuk membuka jawaban <ArrowRight className="w-3 h-3" />
            </p>
          </div>

          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border border-blue-200 rounded-2xl p-8 flex flex-col items-center justify-center shadow-card">
            <span className="text-[10px] uppercase tracking-widest text-blue-500 font-medium mb-4">Jawaban</span>
            <p className="text-base text-center text-slate-700 leading-relaxed">
              {currentCard.answer}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-2xl p-3">
        <div className="flex items-center gap-3 text-xs text-slate-500 px-2">
          <span>D: {currentCard.difficulty.toFixed(1)}</span>
          <span>S: {currentCard.stability.toFixed(1)}</span>
          <span>R: {Math.round(currentCard.retrievability * 100)}%</span>
        </div>
      </div>

      {isFlipped && (
        <div className="animate-fade-in">
          <p className="text-xs text-center text-slate-500 mb-3">Seberapa mudah kamu mengingat jawaban ini?</p>
          <div className="grid grid-cols-4 gap-2">
            {RATING_CONFIG.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRate(r.value)}
                disabled={isSubmitting}
                className={`py-3 rounded-xl border text-sm font-medium transition-all duration-200 disabled:opacity-50 ${r.color}`}
              >
                {r.value === 1 && <X className="w-4 h-4 mx-auto mb-0.5" />}
                {r.value === 4 && <Check className="w-4 h-4 mx-auto mb-0.5" />}
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
