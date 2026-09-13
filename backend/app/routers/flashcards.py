from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Any
import uuid
import aiosqlite
from datetime import datetime, timezone

from backend.app.core.database import get_db
from backend.app.core.security import require_user
from backend.app.models.schemas import (
    FlashcardResponse,
    FlashcardCreate,
    ReviewRequest,
    ReviewResponse,
    RetentionStats,
)
from backend.app.services.fsrs_engine import fsrs_engine

router = APIRouter(prefix="/api/flashcards", tags=["Flashcards & FSRS-6"])

COLUMNS = (
    "id, doc_id, topic_id, question, answer, card_type, difficulty, stability, "
    "retrievability, reps, lapses, state, due, last_review, created_at"
)

# FSRS card states, as stored in the `state` column.
NEW, LEARNING, REVIEW, RELEARNING = 0, 1, 2, 3


def _dt(value):
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value


def _to_response(r: aiosqlite.Row) -> FlashcardResponse:
    last_review = _dt(r["last_review"]) if r["last_review"] else None
    return FlashcardResponse(
        id=r["id"],
        doc_id=r["doc_id"],
        topic_id=r["topic_id"],
        question=r["question"],
        answer=r["answer"],
        card_type=r["card_type"] or "concept",
        difficulty=r["difficulty"],
        stability=r["stability"],
        # Recomputed on read: retrievability decays with time, so the stored value
        # is stale the moment it is written.
        retrievability=(
            fsrs_engine.calculate_retrievability(r["stability"], last_review)
            if last_review
            else 1.0
        ),
        reps=r["reps"],
        lapses=r["lapses"],
        state=r["state"],
        due=_dt(r["due"]),
        last_review=last_review,
        created_at=_dt(r["created_at"]),
    )


@router.get("", response_model=List[FlashcardResponse])
async def list_flashcards(
    due_only: bool = Query(False),
    doc_id: Optional[str] = Query(None),
    limit: int = Query(500, ge=1, le=1000),
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    query = f"SELECT {COLUMNS} FROM flashcards WHERE user_id = ?"
    params: List[Any] = [user_id]

    if doc_id:
        query += " AND doc_id = ?"
        params.append(doc_id)
    if due_only:
        query += " AND due <= ?"
        params.append(datetime.now(timezone.utc).isoformat())

    query += " ORDER BY due ASC LIMIT ?"
    params.append(limit)

    cur = await db.execute(query, params)
    return [_to_response(r) for r in await cur.fetchall()]


@router.get("/stats", response_model=RetentionStats)
async def get_retention_stats(
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    cur = await db.execute(
        "SELECT stability, state, due, last_review FROM flashcards WHERE user_id = ?",
        (user_id,),
    )
    rows = await cur.fetchall()

    due_today = new_cards = learning_cards = review_cards = 0
    retrievability_sum = 0.0
    cards_list = []

    for r in rows:
        due_dt = _dt(r["due"])
        if due_dt and due_dt <= now:
            due_today += 1

        state = r["state"]
        if state == NEW:
            new_cards += 1
        elif state in (LEARNING, RELEARNING):
            learning_cards += 1
        else:
            review_cards += 1

        last_review = _dt(r["last_review"]) if r["last_review"] else None
        retrievability_sum += (
            fsrs_engine.calculate_retrievability(r["stability"], last_review, now)
            if last_review
            else 1.0
        )
        cards_list.append(
            {"due": due_dt, "last_review": last_review, "stability": r["stability"]}
        )

    total = len(rows)
    avg_r = (retrievability_sum / total) if total else 1.0

    return RetentionStats(
        total_cards=total,
        due_today=due_today,
        new_cards=new_cards,
        learning_cards=learning_cards,
        review_cards=review_cards,
        average_retrievability=round(avg_r * 100, 1),
        retention_forecast_7d=fsrs_engine.generate_retention_forecast(cards_list, days_ahead=7),
    )


@router.post("/review", response_model=ReviewResponse)
async def submit_review(
    review: ReviewRequest,
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    cur = await db.execute(
        """
        SELECT id, difficulty, stability, retrievability, reps, lapses, state, due, last_review
        FROM flashcards WHERE id = ? AND user_id = ?
        """,
        (review.card_id, user_id),
    )
    row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    result = fsrs_engine.process_review(dict(row), review.rating)
    due_iso = result["due"].isoformat()
    last_review_iso = result["last_review"].isoformat()

    await db.execute(
        """
        UPDATE flashcards
        SET difficulty = ?, stability = ?, retrievability = ?, reps = ?, lapses = ?,
            state = ?, due = ?, last_review = ?
        WHERE id = ? AND user_id = ?
        """,
        (
            result["difficulty"],
            result["stability"],
            result["retrievability"],
            result["reps"],
            result["lapses"],
            result["state"],
            due_iso,
            last_review_iso,
            review.card_id,
            user_id,
        ),
    )

    await db.execute(
        """
        INSERT INTO review_logs
            (id, card_id, rating, state, due, stability, difficulty, scheduled_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            review.card_id,
            review.rating,
            result["state"],
            due_iso,
            result["stability"],
            result["difficulty"],
            result["interval_days"],
        ),
    )
    await db.commit()

    return ReviewResponse(
        card_id=review.card_id,
        rating=review.rating,
        new_difficulty=round(result["difficulty"], 2),
        new_stability=round(result["stability"], 2),
        new_retrievability=round(result["retrievability"], 2),
        next_due=result["due"],
        interval_days=result["interval_days"],
    )


@router.post("", response_model=FlashcardResponse, status_code=201)
async def create_flashcard(
    card_in: FlashcardCreate,
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    if card_in.doc_id:
        cur = await db.execute(
            "SELECT 1 FROM documents WHERE id = ? AND user_id = ?", (card_in.doc_id, user_id)
        )
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Document not found")

    card_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    await db.execute(
        """
        INSERT INTO flashcards
            (id, user_id, doc_id, topic_id, question, answer, card_type,
             difficulty, stability, retrievability, reps, lapses, state, due, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0.0, 0.0, 1.0, 0, 0, 0, ?, ?)
        """,
        (
            card_id,
            user_id,
            card_in.doc_id,
            card_in.topic_id,
            card_in.question,
            card_in.answer,
            card_in.card_type,
            now.isoformat(),
            now.isoformat(),
        ),
    )
    await db.commit()

    return FlashcardResponse(
        id=card_id,
        doc_id=card_in.doc_id,
        topic_id=card_in.topic_id,
        question=card_in.question,
        answer=card_in.answer,
        card_type=card_in.card_type,
        difficulty=0.0,
        stability=0.0,
        retrievability=1.0,
        reps=0,
        lapses=0,
        state=NEW,
        due=now,
        last_review=None,
        created_at=now,
    )


@router.delete("/{card_id}")
async def delete_flashcard(
    card_id: str,
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    cur = await db.execute(
        "SELECT 1 FROM flashcards WHERE id = ? AND user_id = ?", (card_id, user_id)
    )
    if not await cur.fetchone():
        raise HTTPException(status_code=404, detail="Flashcard not found")

    await db.execute("DELETE FROM review_logs WHERE card_id = ?", (card_id,))
    await db.execute("DELETE FROM flashcards WHERE id = ? AND user_id = ?", (card_id, user_id))
    await db.commit()
    return {"status": "success", "deleted_id": card_id}
