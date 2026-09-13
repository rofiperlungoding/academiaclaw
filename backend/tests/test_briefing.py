"""Self-check for the proactive briefing gate.

Run: PYTHONPATH=. python backend/tests/test_briefing.py

The gate is the whole point of the agent loop: it decides whether a scheduled wake
turns into a message. If it breaks, the agent either goes silent or spams.
"""

from datetime import datetime, timezone, timedelta

from backend.app.services.briefing import compose, should_send

NOW = datetime(2026, 9, 13, 9, 0, tzinfo=timezone.utc)


def state(tasks=(), due_cards=0, weakest=None):
    return {
        "now": NOW,
        "tasks": list(tasks),
        "due_cards": due_cards,
        "weakest_question": weakest,
    }


def task(title, course, days, priority="high"):
    return {
        "title": title,
        "course": course,
        "task_type": "Tugas",
        "deadline": (NOW + timedelta(days=days)).isoformat(),
        "priority": priority,
    }


def test_silent_when_nothing_due():
    c = compose(state())
    assert c["has_content"] is False
    assert c["body"] == ""
    send, reason = should_send(c, None, NOW)
    assert send is False and reason == "nothing_due"


def test_sends_first_briefing():
    c = compose(state(tasks=[task("3NF Report", "Database Systems", 1)], due_cards=4))
    assert c["urgent_tasks_count"] == 1
    assert c["due_flashcards_count"] == 4
    assert "tomorrow" in c["body"]
    assert "4 cards" in c["body"]
    send, reason = should_send(c, None, NOW)
    assert send is True and reason == "first_briefing"


def test_skips_when_state_unchanged():
    c = compose(state(tasks=[task("3NF Report", "Database Systems", 1)], due_cards=4))
    last = {"digest_hash": c["digest_hash"], "sent_at": (NOW - timedelta(hours=3)).isoformat()}
    send, reason = should_send(c, last, NOW)
    assert send is False and reason == "unchanged_since_last_briefing"


def test_rate_limits_rapid_changes():
    c = compose(state(tasks=[task("New Assignment", "Operating Systems", 2)], due_cards=9))
    last = {"digest_hash": "somethingelse", "sent_at": (NOW - timedelta(minutes=5)).isoformat()}
    send, reason = should_send(c, last, NOW)
    assert send is False and reason == "rate_limited"


def test_sends_when_state_changed_after_interval():
    c = compose(state(tasks=[task("New Assignment", "Operating Systems", 2)], due_cards=9))
    last = {"digest_hash": "somethingelse", "sent_at": (NOW - timedelta(hours=5)).isoformat()}
    send, reason = should_send(c, last, NOW)
    assert send is True and reason == "state_changed"


def test_hash_ignores_card_wording_but_tracks_counts():
    a = compose(state(tasks=[task("A", "X", 1)], due_cards=2, weakest="What is 3NF?"))
    b = compose(state(tasks=[task("A", "X", 1)], due_cards=2, weakest="Another question?"))
    assert a["digest_hash"] == b["digest_hash"], "wording change must not re-trigger a push"

    c = compose(state(tasks=[task("A", "X", 1)], due_cards=3))
    assert a["digest_hash"] != c["digest_hash"], "card count change must re-trigger"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("\nall briefing gate checks passed")
