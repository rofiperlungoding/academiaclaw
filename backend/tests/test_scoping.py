"""End-to-end check that one account cannot see or touch another account's data.

Run against a live server:
    PYTHONPATH=. python backend/tests/test_scoping.py [base_url]

This is the check that matters most: before scoping existed every endpoint
answered 200 with no token at all, and every account shared one pile of rows.
"""

import json
import sys
import urllib.error
import urllib.request
import uuid

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")


def call(method, path, token=None, body=None):
    req = urllib.request.Request(f"{BASE}{path}", method=method)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, data) as r:
            return r.status, json.loads(r.read() or "null")
    except urllib.error.HTTPError as e:
        return e.code, None


def register(nim):
    status, payload = call(
        "POST", "/api/auth/register",
        body={"nim": nim, "name": f"User {nim}", "password": "testpass123"},
    )
    assert status in (200, 201), f"register failed: {status}"
    return payload["access_token"]


def test_endpoints_reject_anonymous():
    for path in (
        "/api/knowledge/documents",
        "/api/flashcards",
        "/api/flashcards/stats",
        "/api/tasks",
        "/api/tasks/heartbeat/summary",
        "/api/agent/briefing",
        "/api/agent/notifications",
    ):
        status, _ = call("GET", path)
        assert status == 401, f"{path} answered {status} without a token"


def test_tasks_are_private():
    alice = register(f"test-a-{uuid.uuid4().hex[:10]}")
    bob = register(f"test-b-{uuid.uuid4().hex[:10]}")

    status, task = call(
        "POST", "/api/tasks", alice,
        {
            "title": "Alice private task",
            "course": "Secret Course",
            "task_type": "Assignment",
            "deadline": "2027-01-01T00:00:00Z",
            "priority": "high",
            "notes": "",
        },
    )
    assert status == 201, f"create failed: {status}"
    task_id = task["id"]

    _, alice_tasks = call("GET", "/api/tasks", alice)
    assert any(t["id"] == task_id for t in alice_tasks), "owner cannot see own task"

    _, bob_tasks = call("GET", "/api/tasks", bob)
    assert all(t["id"] != task_id for t in bob_tasks), "LEAK: other account sees the task"

    status, _ = call("PATCH", f"/api/tasks/{task_id}", bob, {"status": "completed"})
    assert status == 404, f"other account could update the task ({status})"

    status, _ = call("DELETE", f"/api/tasks/{task_id}", bob)
    assert status == 404, f"other account could delete the task ({status})"

    status, _ = call("DELETE", f"/api/tasks/{task_id}", alice)
    assert status == 200, "owner could not delete own task"


def test_flashcards_and_stats_are_private():
    alice = register(f"test-c-{uuid.uuid4().hex[:10]}")
    bob = register(f"test-d-{uuid.uuid4().hex[:10]}")

    status, card = call(
        "POST", "/api/flashcards", alice,
        {"question": "Alice question?", "answer": "Alice answer.", "card_type": "concept"},
    )
    assert status == 201, f"create failed: {status}"

    _, bob_cards = call("GET", "/api/flashcards", bob)
    assert all(c["id"] != card["id"] for c in bob_cards), "LEAK: other account sees the card"

    _, bob_stats = call("GET", "/api/flashcards/stats", bob)
    assert bob_stats["total_cards"] == 0, "LEAK: stats count another account's cards"

    status, _ = call("POST", "/api/flashcards/review", bob, {"card_id": card["id"], "rating": 3})
    assert status == 404, f"other account could review the card ({status})"


def test_briefing_is_per_account():
    fresh = register(f"test-e-{uuid.uuid4().hex[:10]}")
    status, briefing = call("GET", "/api/agent/briefing", fresh)
    assert status == 200
    assert briefing["send"] is False, "a brand-new account should have nothing to push"
    assert briefing["reason"] == "nothing_due"
    assert briefing["urgent_tasks_count"] == 0
    assert briefing["due_flashcards_count"] == 0


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("\nall scoping checks passed")
