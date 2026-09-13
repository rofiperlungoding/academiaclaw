"""Builds the proactive briefing that OpenClaw pushes to the student.

This is the agent-facing half of the loop. An OpenClaw Automation wakes on a cron
rule, calls `/api/agent/briefing`, and delivers the returned text to WhatsApp. The
digest hash lets a run be skipped when nothing changed since the last push, so a
30-minute schedule does not turn into 48 identical messages a day.
"""

import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import aiosqlite

URGENT_WINDOW_DAYS = 3
# Never push twice inside this window even if the content changed, so a burst of
# edits cannot produce a burst of messages.
MIN_INTERVAL_MINUTES = 60


def _days_until(deadline: str, now: datetime) -> int:
    dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return max(0, (dt.date() - now.date()).days)


def _humanize(days: int) -> str:
    if days == 0:
        return "today"
    if days == 1:
        return "tomorrow"
    return f"in {days} days"


async def collect_state(db: aiosqlite.Connection, user_id: str) -> Dict[str, Any]:
    """Read the two things the agent watches: near deadlines and due recall cards."""
    now = datetime.now(timezone.utc)
    horizon = now + timedelta(days=URGENT_WINDOW_DAYS)

    cur = await db.execute(
        """
        SELECT title, course, task_type, deadline, priority
        FROM academic_tasks
        WHERE user_id = ? AND status = 'pending' AND deadline <= ?
        ORDER BY deadline ASC
        """,
        (user_id, horizon.isoformat()),
    )
    tasks = [dict(r) for r in await cur.fetchall()]

    cur = await db.execute(
        "SELECT COUNT(*) FROM flashcards WHERE user_id = ? AND due <= ?",
        (user_id, now.isoformat()),
    )
    due_cards = (await cur.fetchone())[0]

    cur = await db.execute(
        """
        SELECT question FROM flashcards
        WHERE user_id = ? AND due <= ?
        ORDER BY retrievability ASC
        LIMIT 1
        """,
        (user_id, now.isoformat()),
    )
    row = await cur.fetchone()
    weakest_question = row["question"] if row else None

    return {
        "now": now,
        "tasks": tasks,
        "due_cards": due_cards,
        "weakest_question": weakest_question,
    }


def compose(state: Dict[str, Any]) -> Dict[str, Any]:
    """Turn raw state into the message body plus a hash of what it reports.

    The body is written deterministically rather than by an LLM: a reminder that
    silently hallucinates a deadline is worse than no reminder.
    """
    now: datetime = state["now"]
    tasks: List[Dict[str, Any]] = state["tasks"]
    due_cards: int = state["due_cards"]

    lines: List[str] = []

    if tasks:
        lines.append(f"⏳ {len(tasks)} deadline coming up:")
        for t in tasks[:5]:
            days = _days_until(t["deadline"], now)
            lines.append(f"• {t['title']} — {t['course']} ({_humanize(days)})")

    if due_cards:
        if lines:
            lines.append("")
        lines.append(f"🧠 {due_cards} cards are due for review.")
        if state.get("weakest_question"):
            lines.append(f"Weakest right now: {state['weakest_question']}")

    has_content = bool(tasks or due_cards)
    if not has_content:
        body = ""
    else:
        lines.append("")
        lines.append("Reply to this message to start reviewing now.")
        body = "\n".join(lines)

    # Hash the facts, not the rendered text, so wording tweaks don't re-trigger a push.
    fingerprint = "|".join(
        [
            str(due_cards),
            *sorted(f"{t['title']}@{t['deadline'][:10]}" for t in tasks),
        ]
    )

    return {
        "body": body,
        "digest_hash": hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()[:32],
        "urgent_tasks_count": len(tasks),
        "due_flashcards_count": due_cards,
        "has_content": has_content,
    }


async def last_notification(db: aiosqlite.Connection, user_id: str) -> Optional[Dict[str, Any]]:
    cur = await db.execute(
        "SELECT digest_hash, sent_at FROM notifications WHERE user_id = ? ORDER BY sent_at DESC LIMIT 1",
        (user_id,),
    )
    row = await cur.fetchone()
    return dict(row) if row else None


def should_send(composed: Dict[str, Any], last: Optional[Dict[str, Any]], now: datetime) -> tuple[bool, str]:
    """Decide whether this run earns a message. Returns (send, reason)."""
    if not composed["has_content"]:
        return False, "nothing_due"

    if last is None:
        return True, "first_briefing"

    if last["digest_hash"] == composed["digest_hash"]:
        return False, "unchanged_since_last_briefing"

    sent_at = datetime.fromisoformat(str(last["sent_at"]).replace("Z", "+00:00"))
    if sent_at.tzinfo is None:
        sent_at = sent_at.replace(tzinfo=timezone.utc)
    if now - sent_at < timedelta(minutes=MIN_INTERVAL_MINUTES):
        return False, "rate_limited"

    return True, "state_changed"


async def record(db: aiosqlite.Connection, composed: Dict[str, Any], channel: str, user_id: str) -> None:
    await db.execute(
        """
        INSERT INTO notifications
            (id, user_id, digest_hash, channel, body, urgent_tasks_count, due_flashcards_count, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            user_id,
            composed["digest_hash"],
            channel,
            composed["body"],
            composed["urgent_tasks_count"],
            composed["due_flashcards_count"],
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    await db.commit()
