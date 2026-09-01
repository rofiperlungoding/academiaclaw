import pytest
from datetime import datetime, timezone, timedelta
from backend.app.services.fsrs_engine import fsrs_engine

def test_new_card_creation():
    card = fsrs_engine.create_new_card()
    assert card["difficulty"] == 0.0
    assert card["stability"] == 0.0
    assert card["retrievability"] == 1.0
    assert card["reps"] == 0
    assert card["lapses"] == 0

def test_fsrs_review_lifecycle():
    card = fsrs_engine.create_new_card()
    
    first_review = fsrs_engine.process_review(card, 3)
    assert first_review["reps"] == 1
    assert first_review["lapses"] == 0
    assert first_review["stability"] > 0
    assert first_review["difficulty"] > 0
    assert first_review["due"] > first_review["last_review"]

    second_review = fsrs_engine.process_review(first_review, 4)
    assert second_review["reps"] == 2
    assert second_review["stability"] >= first_review["stability"]

    failed_review = fsrs_engine.process_review(second_review, 1)
    assert failed_review["reps"] == 3
    assert failed_review["lapses"] == 1

def test_retrievability_decay():
    now = datetime.now(timezone.utc)
    past_review = now - timedelta(days=10)
    stability = 5.0
    
    retrievability = fsrs_engine.calculate_retrievability(stability, past_review, now)
    assert 0.0 <= retrievability <= 1.0
    assert retrievability < 0.90

def test_retention_forecast():
    now = datetime.now(timezone.utc)
    cards = [
        {"due": now + timedelta(days=1), "last_review": now, "stability": 3.0},
        {"due": now + timedelta(days=3), "last_review": now, "stability": 6.0}
    ]
    forecast = fsrs_engine.generate_retention_forecast(cards, days_ahead=5)
    assert len(forecast) == 5
    assert "projected_retention" in forecast[0]
    assert "due_cards" in forecast[0]

if __name__ == "__main__":
    test_new_card_creation()
    test_fsrs_review_lifecycle()
    test_retrievability_decay()
    test_retention_forecast()
    print("All FSRS-6 tests passed successfully!")
