from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
import uuid
import aiosqlite
from datetime import datetime, timezone, timedelta

from backend.app.core.database import get_db
from backend.app.core.security import require_user
from backend.app.models.schemas import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["Academic Tasks & Schedule"])

COLUMNS = "id, title, course, task_type, deadline, priority, status, notes, source_doc_id, created_at"


def _dt(value) -> datetime:
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value


def _to_response(r: aiosqlite.Row) -> TaskResponse:
    return TaskResponse(
        id=r["id"],
        title=r["title"],
        course=r["course"],
        task_type=r["task_type"],
        deadline=_dt(r["deadline"]),
        priority=r["priority"],
        status=r["status"],
        notes=r["notes"] or "",
        source_doc_id=r["source_doc_id"],
        created_at=_dt(r["created_at"]),
    )


async def _owned_task(db: aiosqlite.Connection, task_id: str, user_id: str) -> aiosqlite.Row:
    """Fetch a task the caller owns, or 404.

    Returning 404 rather than 403 for someone else's task keeps the API from
    confirming that an id exists on another account.
    """
    cur = await db.execute(
        f"SELECT {COLUMNS} FROM academic_tasks WHERE id = ? AND user_id = ?",
        (task_id, user_id),
    )
    row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    return row


@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    status: Optional[str] = Query(None),
    course: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    query = f"SELECT {COLUMNS} FROM academic_tasks WHERE user_id = ?"
    params: List[Any] = [user_id]

    if status:
        query += " AND status = ?"
        params.append(status)
    if course:
        query += " AND course = ?"
        params.append(course)

    query += " ORDER BY deadline ASC LIMIT ?"
    params.append(limit)

    cur = await db.execute(query, params)
    return [_to_response(r) for r in await cur.fetchall()]


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    task_in: TaskCreate,
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    await db.execute(
        """
        INSERT INTO academic_tasks
            (id, user_id, title, course, task_type, deadline, priority, status, notes, source_doc_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
        """,
        (
            task_id,
            user_id,
            task_in.title,
            task_in.course,
            task_in.task_type,
            task_in.deadline.isoformat(),
            task_in.priority,
            task_in.notes or "",
            task_in.source_doc_id,
            now.isoformat(),
        ),
    )
    await db.commit()

    return TaskResponse(
        id=task_id,
        title=task_in.title,
        course=task_in.course,
        task_type=task_in.task_type,
        deadline=task_in.deadline,
        priority=task_in.priority,
        status="pending",
        notes=task_in.notes or "",
        source_doc_id=task_in.source_doc_id,
        created_at=now,
    )


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_in: TaskUpdate,
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    await _owned_task(db, task_id, user_id)

    updates = {
        "title": task_in.title,
        "course": task_in.course,
        "task_type": task_in.task_type,
        "deadline": task_in.deadline.isoformat() if task_in.deadline else None,
        "priority": task_in.priority,
        "status": task_in.status,
        "notes": task_in.notes,
    }
    fields = {k: v for k, v in updates.items() if v is not None}

    if fields:
        assignments = ", ".join(f"{k} = ?" for k in fields)
        await db.execute(
            f"UPDATE academic_tasks SET {assignments} WHERE id = ? AND user_id = ?",
            [*fields.values(), task_id, user_id],
        )
        await db.commit()

    return _to_response(await _owned_task(db, task_id, user_id))


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    await _owned_task(db, task_id, user_id)
    await db.execute(
        "DELETE FROM academic_tasks WHERE id = ? AND user_id = ?", (task_id, user_id)
    )
    await db.commit()
    return {"status": "success", "deleted_id": task_id}


@router.get("/heartbeat/summary")
async def get_heartbeat_summary(
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    horizon = now + timedelta(days=3)

    cur = await db.execute(
        """
        SELECT id, title, course, task_type, deadline, priority
        FROM academic_tasks
        WHERE user_id = ? AND status = 'pending' AND deadline <= ?
        ORDER BY deadline ASC
        """,
        (user_id, horizon.isoformat()),
    )
    task_rows = await cur.fetchall()

    cur = await db.execute(
        "SELECT COUNT(*) FROM flashcards WHERE user_id = ? AND due <= ?",
        (user_id, now.isoformat()),
    )
    due_cards_count = (await cur.fetchone())[0]

    return {
        "timestamp": now.isoformat(),
        "urgent_tasks_count": len(task_rows),
        "due_flashcards_count": due_cards_count,
        "urgent_tasks": [
            {
                "id": t["id"],
                "title": t["title"],
                "course": t["course"],
                "deadline": t["deadline"],
                "priority": t["priority"],
            }
            for t in task_rows
        ],
        "proactive_notification_recommended": len(task_rows) > 0 or due_cards_count > 0,
    }
