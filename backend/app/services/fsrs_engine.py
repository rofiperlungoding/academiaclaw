from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from fsrs import Card as FSRSCard, Rating as FSRSRating, Scheduler, State as FSRSState

class FSRSEngine:
    def __init__(self, desired_retention: float = 0.90):
        self.desired_retention = desired_retention
        self.scheduler = Scheduler(desired_retention=desired_retention)

    def rating_from_int(self, val: int) -> FSRSRating:
        mapping = {
            1: FSRSRating.Again,
            2: FSRSRating.Hard,
            3: FSRSRating.Good,
            4: FSRSRating.Easy
        }
        return mapping.get(val, FSRSRating.Good)

    def calculate_retrievability(self, stability: float, last_review: datetime, current_time: datetime = None) -> float:
        """Probability of recall right now, per the scheduler's own forgetting curve.

        Delegated to py-fsrs rather than hand-rolled: FSRS-6 fits the curve's decay
        as a trained weight (w20), so the fixed -0.5 exponent of FSRS-4.5/5 drifts
        badly on long intervals — ~25 points too pessimistic at one year.
        """
        if stability is None or stability <= 0:
            return 1.0
        if current_time is None:
            current_time = datetime.now(timezone.utc)
        if last_review.tzinfo is None:
            last_review = last_review.replace(tzinfo=timezone.utc)
        if current_time.tzinfo is None:
            current_time = current_time.replace(tzinfo=timezone.utc)

        card = FSRSCard(
            state=FSRSState.Review,
            stability=float(stability),
            difficulty=5.0,  # unused by the retrievability term
            due=current_time,
            last_review=last_review,
        )
        return max(0.0, min(1.0, self.scheduler.get_card_retrievability(card, current_time)))

    def create_new_card(self) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        return {
            "difficulty": 0.0,
            "stability": 0.0,
            "retrievability": 1.0,
            "reps": 0,
            "lapses": 0,
            "state": 0,
            "due": now,
            "last_review": None
        }

    def process_review(self, card_data: Dict[str, Any], rating_int: int) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        state_map = {
            0: FSRSState.Learning,
            1: FSRSState.Learning,
            2: FSRSState.Review,
            3: FSRSState.Relearning
        }
        raw_state = card_data.get("state", 0)
        fsrs_state = state_map.get(raw_state, FSRSState.Learning)

        due_val = card_data.get("due")
        if isinstance(due_val, str):
            due_dt = datetime.fromisoformat(due_val.replace('Z', '+00:00'))
        elif isinstance(due_val, datetime):
            due_dt = due_val
        else:
            due_dt = now

        last_review_val = card_data.get("last_review")
        last_review_dt = None
        if isinstance(last_review_val, str):
            last_review_dt = datetime.fromisoformat(last_review_val.replace('Z', '+00:00'))
        elif isinstance(last_review_val, datetime):
            last_review_dt = last_review_val

        if due_dt.tzinfo is None:
            due_dt = due_dt.replace(tzinfo=timezone.utc)
        if last_review_dt and last_review_dt.tzinfo is None:
            last_review_dt = last_review_dt.replace(tzinfo=timezone.utc)

        stability = card_data.get("stability")
        difficulty = card_data.get("difficulty")
        if stability is not None and stability <= 0:
            stability = None
        if difficulty is not None and difficulty <= 0:
            difficulty = None

        card = FSRSCard(
            state=fsrs_state,
            stability=stability,
            difficulty=difficulty,
            due=due_dt,
            last_review=last_review_dt
        )

        rating = self.rating_from_int(rating_int)
        updated_card, review_log = self.scheduler.review_card(card, rating, now)

        new_due = updated_card.due
        if new_due.tzinfo is None:
            new_due = new_due.replace(tzinfo=timezone.utc)

        interval_seconds = (new_due - now).total_seconds()
        interval_days = max(1, int(round(interval_seconds / 86400.0))) if interval_seconds >= 86400 else 0

        reps = card_data.get("reps", 0) + 1
        lapses = card_data.get("lapses", 0) + (1 if rating_int == 1 else 0)
        
        state_int = int(updated_card.state.value) if hasattr(updated_card.state, 'value') else 2
        new_stability = float(updated_card.stability) if updated_card.stability is not None else 1.0
        new_difficulty = float(updated_card.difficulty) if updated_card.difficulty is not None else 5.0
        new_retrievability = self.calculate_retrievability(new_stability, now, now)

        return {
            "difficulty": new_difficulty,
            "stability": new_stability,
            "retrievability": new_retrievability,
            "reps": reps,
            "lapses": lapses,
            "state": state_int,
            "due": new_due,
            "last_review": now,
            "interval_days": interval_days,
            "rating": rating_int
        }

    def generate_retention_forecast(self, cards: List[Dict[str, Any]], days_ahead: int = 7) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        forecast = []
        
        for d in range(days_ahead):
            target_date = now + timedelta(days=d)
            due_count = 0
            retrievability_sum = 0.0
            
            for c in cards:
                c_due = c.get("due")
                if isinstance(c_due, str):
                    c_due = datetime.fromisoformat(c_due.replace('Z', '+00:00'))
                if c_due and c_due.tzinfo is None:
                    c_due = c_due.replace(tzinfo=timezone.utc)
                
                if c_due and c_due.date() <= target_date.date():
                    due_count += 1
                
                last_rev = c.get("last_review")
                if isinstance(last_rev, str):
                    last_rev = datetime.fromisoformat(last_rev.replace('Z', '+00:00'))
                
                stab = c.get("stability", 1.0)
                if last_rev:
                    r = self.calculate_retrievability(stab, last_rev, target_date)
                else:
                    r = 1.0
                retrievability_sum += r
            
            avg_r = (retrievability_sum / len(cards)) if cards else 1.0
            forecast.append({
                "day_offset": d,
                "date": target_date.strftime("%Y-%m-%d"),
                "due_cards": due_count,
                "projected_retention": round(avg_r * 100, 1)
            })
            
        return forecast

fsrs_engine = FSRSEngine()
