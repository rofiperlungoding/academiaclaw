import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, ArrowRight } from 'lucide-react';
import type { Flashcard } from '../../types';
import { api } from '../../api';
import confetti from 'canvas-confetti';

const RATINGS = [
  { value: 1, label: 'Forgot' },
  { value: 2, label: 'Hard' },
  { value: 3, label: 'Good' },
  { value: 4, label: 'Easy' },
];

const STATES = ['New', 'Learning', 'Review', 'Relearning'];

export function ReviewPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [error, setError] = useState('');

  const fetchDueCards = useCallback(async () => {
    setLoading(true);
    try {
      const due = await api.getFlashcards(true);
      if (due.length > 0) {
        setCards(due);
      } else {
        // Nothing due: fall back to free review over the whole deck.
        const all = await api.getFlashcards(false);
        setCards(all);
        if (all.length === 0) setIsComplete(true);
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

  const handleRate = useCallback(
    async (rating: number) => {
      if (!currentCard || isSubmitting) return;
      setIsSubmitting(true);
      setError('');
      try {
        await api.submitReview(currentCard.id, rating);
        setReviewedCount((c) => c + 1);
        setRatingCounts((prev) => ({ ...prev, [rating]: (prev[rating] || 0) + 1 }));

        if (currentIndex + 1 >= cards.length) {
          setIsComplete(true);
          confetti({ particleCount: 70, spread: 60, scalar: 0.8, origin: { y: 0.75 } });
        } else {
          setCurrentIndex((i) => i + 1);
          setIsFlipped(false);
        }
      } catch {
        setError('Could not submit the review. Try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, isSubmitting, currentIndex, cards.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isComplete || loading || !currentCard) return;
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (isFlipped && e.key >= '1' && e.key <= '4') {
        handleRate(Number(e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isComplete, loading, currentCard, isFlipped, handleRate]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto pt-20 text-center">
        <p className="text-[13px] text-zinc-400">Preparing FSRS-6 cards…</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="max-w-sm mx-auto pt-16 animate-fade-in">
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900">Session complete</h1>
        <p className="mt-2 muted">
          {reviewedCount > 0
            ? `${reviewedCount} cards reviewed. FSRS-6 has updated your intervals.`
            : 'Nothing is due. Every concept is holding steady.'}
        </p>

        {reviewedCount > 0 && (
          <dl className="mt-8 grid grid-cols-4 border-y border-zinc-100">
            {RATINGS.map((r) => (
              <div key={r.value} className="py-4">
                <dt className="text-lg font-semibold text-zinc-900 leading-none">
                  {ratingCounts[r.value] || 0}
                </dt>
                <dd className="mt-1.5 text-[11px] text-zinc-400">{r.label}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-8 flex gap-2">
          <button onClick={() => navigate('/app')} className="btn-secondary flex-1">
            Home
          </button>
          <button
            onClick={() => {
              setIsComplete(false);
              setCurrentIndex(0);
              setIsFlipped(false);
              setReviewedCount(0);
              setRatingCounts({ 1: 0, 2: 0, 3: 0, 4: 0 });
              fetchDueCards();
            }}
            className="btn-primary flex-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <header className="flex items-baseline justify-between">
        <h1 className="page-title">Active recall</h1>
        <span className="text-xs text-zinc-400">
          {currentIndex + 1} / {cards.length}
        </span>
      </header>

      <div className="mt-4 h-0.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-900 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* card */}
      <div className="mt-6 perspective select-none" onClick={() => setIsFlipped((f) => !f)}>
        <div
          className={`relative w-full min-h-[260px] preserve-3d transition-transform duration-500 ease-out cursor-pointer ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          <div className="absolute inset-0 backface-hidden card p-7 flex flex-col">
            <span className="eyebrow">Question</span>
            <p className="flex-1 flex items-center text-[17px] leading-relaxed font-medium text-zinc-900">
              {currentCard.question}
            </p>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              Press <span className="kbd">Space</span> to reveal
            </p>
          </div>

          <div className="absolute inset-0 backface-hidden rotate-y-180 card p-7 flex flex-col bg-zinc-50">
            <span className="eyebrow">Answer</span>
            <p className="flex-1 flex items-center text-[15px] leading-relaxed text-zinc-800 whitespace-pre-wrap">
              {currentCard.answer}
            </p>
            <p className="text-xs text-zinc-400">Rate how well you recalled it</p>
          </div>
        </div>
      </div>

      {/* fsrs metadata */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400">
        <span>D {currentCard.difficulty.toFixed(1)}</span>
        <span>S {currentCard.stability.toFixed(1)}d</span>
        <span>R {Math.round(currentCard.retrievability * 100)}%</span>
        <span>{STATES[currentCard.state] ?? 'New'}</span>
        <span className="ml-auto">{currentCard.card_type || 'concept'}</span>
      </div>

      {error && <p role="alert" className="mt-3 text-[13px] text-red-600">{error}</p>}

      {/* actions */}
      <div className="mt-6">
        {isFlipped ? (
          <div className="grid grid-cols-4 gap-2 animate-fade-in">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRate(r.value)}
                disabled={isSubmitting}
                className="btn-secondary flex-col h-14 gap-0.5"
              >
                <span>{r.label}</span>
                <span className="text-[10px] text-zinc-400">{r.value}</span>
              </button>
            ))}
          </div>
        ) : (
          <button onClick={() => setIsFlipped(true)} className="btn-primary w-full">
            Show answer
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
