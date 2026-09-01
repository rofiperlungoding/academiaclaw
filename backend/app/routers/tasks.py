from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
import uuid
import aiosqlite
from datetime import datetime, timezone, timedelta

from backend.app.core.database import get_db
from backend.app.models.schemas import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["Academic Tasks & Schedule"])

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    status: Optional[str] = Query(None),
    course: Optional[str] = Query(None),
    db: aiosqlite.Connection = Depends(get_db)
):
    query = "SELECT id, title, course, task_type, deadline, priority, status, notes, source_doc_id, created_at FROM academic_tasks"
    conditions = []
    params = []

    if status:
        conditions.append("status = ?")
        params.append(status)
    if course:
        conditions.append("course = ?")
        params.append(course)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY deadline ASC"

    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()

    tasks = []
    for r in rows:
        dl_dt = datetime.fromisoformat(r["deadline"].replace('Z', '+00:00')) if isinstance(r["deadline"], str) else r["deadline"]
        cr_dt = datetime.fromisoformat(r["created_at"].replace('Z', '+00:00')) if isinstance(r["created_at"], str) else r["created_at"]
        tasks.append(TaskResponse(
            id=r["id"],
            title=r["title"],
            course=r["course"],
            task_type=r["task_type"],
            deadline=dl_dt,
            priority=r["priority"],
            status=r["status"],
            notes=r["notes"] or "",
            source_doc_id=r["source_doc_id"],
            created_at=cr_dt
        ))
    return tasks

@router.post("", response_model=TaskResponse)
async def create_task(task_in: TaskCreate, db: aiosqlite.Connection = Depends(get_db)):
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    dl_iso = task_in.deadline.isoformat()

    await db.execute(
        """
        INSERT INTO academic_tasks (id, title, course, task_type, deadline, priority, status, notes, source_doc_id)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        """,
        (task_id, task_in.title, task_in.course, task_in.task_type, dl_iso, task_in.priority, task_in.notes or "", task_in.source_doc_id)
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
        created_at=now
    )

@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_in: TaskUpdate, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id, title, course, task_type, deadline, priority, status, notes, source_doc_id, created_at FROM academic_tasks WHERE id = ?", (task_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")

    fields = []
    values = []

    if task_in.title is not None:
        fields.append("title = ?")
        values.append(task_in.title)
    if task_in.course is not None:
        fields.append("course = ?")
        values.append(task_in.course)
    if task_in.task_type is not None:
        fields.append("task_type = ?")
        values.append(task_in.task_type)
    if task_in.deadline is not None:
        fields.append("deadline = ?")
        values.append(task_in.deadline.isoformat())
    if task_in.priority is not None:
        fields.append("priority = ?")
        values.append(task_in.priority)
    if task_in.status is not None:
        fields.append("status = ?")
        values.append(task_in.status)
    if task_in.notes is not None:
        fields.append("notes = ?")
        values.append(task_in.notes)

    if fields:
        values.append(task_id)
        await db.execute(f"UPDATE academic_tasks SET {', '.join(fields)} WHERE id = ?", values)
        await db.commit()

    cur_updated = await db.execute("SELECT id, title, course, task_type, deadline, priority, status, notes, source_doc_id, created_at FROM academic_tasks WHERE id = ?", (task_id,))
    r = await cur_updated.fetchone()
    
    dl_dt = datetime.fromisoformat(r["deadline"].replace('Z', '+00:00')) if isinstance(r["deadline"], str) else r["deadline"]
    cr_dt = datetime.fromisoformat(r["created_at"].replace('Z', '+00:00')) if isinstance(r["created_at"], str) else r["created_at"]

    return TaskResponse(
        id=r["id"],
        title=r["title"],
        course=r["course"],
        task_type=r["task_type"],
        deadline=dl_dt,
        priority=r["priority"],
        status=r["status"],
        notes=r["notes"] or "",
        source_doc_id=r["source_doc_id"],
        created_at=cr_dt
    )

@router.delete("/{task_id}")
async def delete_task(task_id: str, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM academic_tasks WHERE id = ?", (task_id,))
    await db.commit()
    return {"status": "success", "deleted_id": task_id}

@router.get("/heartbeat/summary")
async def get_heartbeat_summary(db: aiosqlite.Connection = Depends(get_db)) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    in_3_days = now + timedelta(days=3)

    cur_tasks = await db.execute(
        "SELECT id, title, course, task_type, deadline, priority FROM academic_tasks WHERE status = 'pending' AND deadline <= ? ORDER BY deadline ASC",
        (in_3_days.isoformat(),)
    )
    task_rows = await cur_tasks.fetchall()
    
    cur_cards = await db.execute(
        "SELECT COUNT(*) FROM flashcards WHERE due <= ?",
        (now.isoformat(),)
    )
    due_cards_count = (await cur_cards.fetchone())[0]

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
                "priority": t["priority"]
            }
            for t in task_rows
        ],
        "proactive_notification_recommended": len(task_rows) > 0 or due_cards_count > 0
    }
