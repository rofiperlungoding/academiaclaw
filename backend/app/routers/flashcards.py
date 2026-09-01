from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import uuid
import aiosqlite
from datetime import datetime, timezone

from backend.app.core.database import get_db
from backend.app.models.schemas import (
    FlashcardResponse,
    FlashcardCreate,
    ReviewRequest,
    ReviewResponse,
    RetentionStats
)
from backend.app.services.fsrs_engine import fsrs_engine

router = APIRouter(prefix="/api/flashcards", tags=["Flashcards & FSRS-6"])

@router.get("", response_model=List[FlashcardResponse])
async def list_flashcards(
    due_only: bool = Query(False),
    doc_id: Optional[str] = Query(None),
    db: aiosqlite.Connection = Depends(get_db)
):
    now = datetime.now(timezone.utc).isoformat()
    
    query = "SELECT id, doc_id, topic_id, question, answer, card_type, difficulty, stability, retrievability, reps, lapses, state, due, last_review, created_at FROM flashcards"
    conditions = []
    params = []
    
    if doc_id:
        conditions.append("doc_id = ?")
        params.append(doc_id)
        
    if due_only:
        conditions.append("due <= ?")
        params.append(now)
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    query += " ORDER BY due ASC"
    
    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    
    cards = []
    for r in rows:
        due_dt = datetime.fromisoformat(r["due"].replace('Z', '+00:00')) if isinstance(r["due"], str) else r["due"]
        last_rev_dt = datetime.fromisoformat(r["last_review"].replace('Z', '+00:00')) if r["last_review"] and isinstance(r["last_review"], str) else r["last_review"]
        created_dt = datetime.fromisoformat(r["created_at"].replace('Z', '+00:00')) if isinstance(r["created_at"], str) else r["created_at"]
        
        cur_retrievability = fsrs_engine.calculate_retrievability(r["stability"], last_rev_dt) if last_rev_dt else 1.0

        cards.append(FlashcardResponse(
            id=r["id"],
            doc_id=r["doc_id"],
            topic_id=r["topic_id"],
            question=r["question"],
            answer=r["answer"],
            card_type=r["card_type"] or "concept",
            difficulty=r["difficulty"],
            stability=r["stability"],
            retrievability=cur_retrievability,
            reps=r["reps"],
            lapses=r["lapses"],
            state=r["state"],
            due=due_dt,
            last_review=last_rev_dt,
            created_at=created_dt
        ))
        
    return cards

@router.get("/stats", response_model=RetentionStats)
async def get_retention_stats(db: aiosqlite.Connection = Depends(get_db)):
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    cursor = await db.execute("SELECT id, difficulty, stability, retrievability, state, due, last_review FROM flashcards")
    rows = await cursor.fetchall()
    
    total_cards = len(rows)
    due_today = 0
    new_cards = 0
    learning_cards = 0
    review_cards = 0
    retrievability_sum = 0.0
    
    cards_list = []
    for r in rows:
        due_str = r["due"]
        last_rev = r["last_review"]
        state = r["state"]
        
        due_dt = datetime.fromisoformat(due_str.replace('Z', '+00:00')) if isinstance(due_str, str) else due_str
        if due_dt and due_dt <= now:
            due_today += 1
            
        if state == 0:
            new_cards += 1
        elif state in [1, 3]:
            learning_cards += 1
        else:
            review_cards += 1
            
        last_dt = datetime.fromisoformat(last_rev.replace('Z', '+00:00')) if last_rev and isinstance(last_rev, str) else last_rev
        cur_r = fsrs_engine.calculate_retrievability(r["stability"], last_dt, now) if last_dt else 1.0
        retrievability_sum += cur_r
        
        cards_list.append({
            "due": due_dt,
            "last_review": last_dt,
            "stability": r["stability"]
        })
        
    avg_r = (retrievability_sum / total_cards) if total_cards > 0 else 1.0
    forecast = fsrs_engine.generate_retention_forecast(cards_list, days_ahead=7)
    
    return RetentionStats(
        total_cards=total_cards,
        due_today=due_today,
        new_cards=new_cards,
        learning_cards=learning_cards,
        review_cards=review_cards,
        average_retrievability=round(avg_r * 100, 1),
        retention_forecast_7d=forecast
    )

@router.post("/review", response_model=ReviewResponse)
async def submit_review(review: ReviewRequest, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, difficulty, stability, retrievability, reps, lapses, state, due, last_review FROM flashcards WHERE id = ?",
        (review.card_id,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    card_dict = dict(row)
    updated_result = fsrs_engine.process_review(card_dict, review.rating)
    
    new_due_iso = updated_result["due"].isoformat()
    new_last_rev_iso = updated_result["last_review"].isoformat()

    await db.execute(
        """
        UPDATE flashcards 
        SET difficulty = ?, stability = ?, retrievability = ?, reps = ?, lapses = ?, state = ?, due = ?, last_review = ?
        WHERE id = ?
        """,
        (
            updated_result["difficulty"],
            updated_result["stability"],
            updated_result["retrievability"],
            updated_result["reps"],
            updated_result["lapses"],
            updated_result["state"],
            new_due_iso,
            new_last_rev_iso,
            review.card_id
        )
    )

    log_id = str(uuid.uuid4())
    await db.execute(
        """
        INSERT INTO review_logs (id, card_id, rating, state, due, stability, difficulty, scheduled_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            log_id,
            review.card_id,
            review.rating,
            updated_result["state"],
            new_due_iso,
            updated_result["stability"],
            updated_result["difficulty"],
            updated_result["interval_days"]
        )
    )

    await db.commit()

    return ReviewResponse(
        card_id=review.card_id,
        rating=review.rating,
        new_difficulty=round(updated_result["difficulty"], 2),
        new_stability=round(updated_result["stability"], 2),
        new_retrievability=round(updated_result["retrievability"], 2),
        next_due=updated_result["due"],
        interval_days=updated_result["interval_days"]
    )

@router.post("", response_model=FlashcardResponse)
async def create_flashcard(card_in: FlashcardCreate, db: aiosqlite.Connection = Depends(get_db)):
    card_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    await db.execute(
        """
        INSERT INTO flashcards (id, doc_id, topic_id, question, answer, card_type, difficulty, stability, retrievability, reps, lapses, state, due)
        VALUES (?, ?, ?, ?, ?, ?, 0.0, 0.0, 1.0, 0, 0, 0, ?)
        """,
        (card_id, card_in.doc_id, card_in.topic_id, card_in.question, card_in.answer, card_in.card_type, now_iso)
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
        state=0,
        due=now,
        last_review=None,
        created_at=now
    )

@router.delete("/{card_id}")
async def delete_flashcard(card_id: str, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM flashcards WHERE id = ?", (card_id,))
    await db.execute("DELETE FROM review_logs WHERE card_id = ?", (card_id,))
    await db.commit()
    return {"status": "success", "deleted_id": card_id}
