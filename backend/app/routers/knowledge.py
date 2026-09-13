from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Optional, Any, Dict
import uuid
import os
import json
import aiosqlite
from datetime import datetime, timezone, timedelta

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.security import require_user
from backend.app.models.schemas import (
    DocumentResponse,
    KnowledgeGraphResponse,
    EntitySchema,
    RelationSchema,
    TopicSchema,
    AskRagRequest,
    AskRagResponse,
)
from backend.app.services.pdf_parser import doc_parser
from backend.app.services.lightrag_engine import lightrag_engine
from backend.app.services import retrieval

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge & LightRAG"])

# A 4 GB VPS cannot absorb an arbitrarily large upload, and the whole file is held
# while text is extracted. 20 MB covers a long lecture deck with room to spare.
MAX_UPLOAD_BYTES = 20 * 1024 * 1024
CHUNK_BYTES = 64 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}


def _dt(value):
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value


def _clean_name(filename: str) -> str:
    """Strip any directory component from a client-supplied filename.

    The bytes land under a uuid regardless, but the original name is stored and
    displayed, so it should not read like a path.
    """
    return os.path.basename((filename or "").replace("\\", "/").strip()) or "document"


def _safe_extension(filename: str) -> str:
    """Return a vetted extension. Never trust the client's filename in a path.

    `os.path.join(dir, f"{uuid}_{filename}")` lets a filename of `../../x` escape
    the storage directory, so only the extension survives and the stored name is
    the document's own uuid.
    """
    ext = os.path.splitext(filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    return ext


async def _store_upload(file: UploadFile, dest: str) -> int:
    """Stream the upload to disk, aborting past the size cap. Returns bytes written."""
    written = 0
    try:
        with open(dest, "wb") as out:
            while chunk := await file.read(CHUNK_BYTES):
                written += len(chunk)
                if written > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit.",
                    )
                out.write(chunk)
    except Exception:
        if os.path.exists(dest):
            os.remove(dest)
        raise
    return written


async def _owned_document(db: aiosqlite.Connection, doc_id: str, user_id: str) -> aiosqlite.Row:
    cur = await db.execute(
        "SELECT id, file_path FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id)
    )
    row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    return row


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    ext = _safe_extension(file.filename)
    original_name = _clean_name(file.filename)
    doc_id = str(uuid.uuid4())
    doc_title = (title or os.path.splitext(original_name)[0] or "Untitled").strip()[:200]
    file_path = os.path.join(settings.storage_dir, f"{doc_id}{ext}")

    file_size = await _store_upload(file, file_path)

    # Parse before writing any row: a file we cannot read must not leave a
    # half-created document behind.
    try:
        extracted_text = doc_parser.extract_text_from_file(file_path)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Could not read the document: {e}")

    if not extracted_text.strip():
        os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail="No text could be extracted. A scanned PDF needs OCR first.",
        )

    extracted = await lightrag_engine.extract_graph_and_topics(extracted_text, doc_title)
    now = datetime.now(timezone.utc)

    await db.execute(
        """
        INSERT INTO documents
            (id, user_id, title, filename, file_path, file_size, extracted_text, summary, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            doc_id,
            user_id,
            doc_title,
            original_name,
            file_path,
            file_size,
            extracted_text,
            extracted.get("summary", ""),
            now.isoformat(),
        ),
    )

    entities = extracted.get("entities", [])
    await db.executemany(
        "INSERT INTO graph_entities (id, doc_id, name, entity_type, description) VALUES (?, ?, ?, ?, ?)",
        [
            (str(uuid.uuid4()), doc_id, e["name"], e.get("type", "Concept"), e.get("description", ""))
            for e in entities
            if e.get("name")
        ],
    )

    relations = extracted.get("relations", [])
    await db.executemany(
        """
        INSERT INTO graph_relations
            (id, doc_id, source_name, target_name, relation_type, description, weight)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                str(uuid.uuid4()),
                doc_id,
                r["source"],
                r["target"],
                r.get("relation", "relates_to"),
                r.get("description", ""),
                r.get("weight", 1.0),
            )
            for r in relations
            if r.get("source") and r.get("target")
        ],
    )

    topics = extracted.get("topics", [])
    await db.executemany(
        "INSERT INTO graph_topics (id, doc_id, title, summary, key_entities) VALUES (?, ?, ?, ?, ?)",
        [
            (
                str(uuid.uuid4()),
                doc_id,
                t["title"],
                t.get("summary", ""),
                json.dumps(t.get("key_entities", [])),
            )
            for t in topics
            if t.get("title")
        ],
    )

    await db.executemany(
        """
        INSERT INTO academic_tasks
            (id, user_id, title, course, task_type, deadline, priority, notes, source_doc_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                str(uuid.uuid4()),
                user_id,
                t["title"],
                t.get("course", doc_title),
                t.get("task_type", "Assignment"),
                (now + timedelta(days=int(t.get("deadline_days", 7)))).isoformat(),
                t.get("priority", "medium"),
                t.get("notes", ""),
                doc_id,
                now.isoformat(),
            )
            for t in extracted.get("tasks", [])
            if t.get("title")
        ],
    )

    await db.executemany(
        """
        INSERT INTO flashcards
            (id, user_id, doc_id, question, answer, card_type,
             difficulty, stability, retrievability, reps, lapses, state, due, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0.0, 0.0, 1.0, 0, 0, 0, ?, ?)
        """,
        [
            (
                str(uuid.uuid4()),
                user_id,
                doc_id,
                c["question"],
                c["answer"],
                c.get("card_type", "concept"),
                now.isoformat(),
                now.isoformat(),
            )
            for c in extracted.get("flashcards", [])
            if c.get("question") and c.get("answer")
        ],
    )

    await db.commit()

    return DocumentResponse(
        id=doc_id,
        title=doc_title,
        filename=original_name,
        file_size=file_size,
        summary=extracted.get("summary", ""),
        created_at=now,
        entities_count=len(entities),
        relations_count=len(relations),
        topics_count=len(topics),
    )


@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    # One aggregate query instead of three COUNT round-trips per document.
    cur = await db.execute(
        """
        SELECT d.id, d.title, d.filename, d.file_size, d.summary, d.created_at,
               (SELECT COUNT(*) FROM graph_entities  e WHERE e.doc_id = d.id) AS entities_count,
               (SELECT COUNT(*) FROM graph_relations r WHERE r.doc_id = d.id) AS relations_count,
               (SELECT COUNT(*) FROM graph_topics    t WHERE t.doc_id = d.id) AS topics_count
        FROM documents d
        WHERE d.user_id = ?
        ORDER BY d.created_at DESC
        """,
        (user_id,),
    )
    return [
        DocumentResponse(
            id=r["id"],
            title=r["title"],
            filename=r["filename"],
            file_size=r["file_size"],
            summary=r["summary"] or "",
            created_at=_dt(r["created_at"]),
            entities_count=r["entities_count"],
            relations_count=r["relations_count"],
            topics_count=r["topics_count"],
        )
        for r in await cur.fetchall()
    ]


async def _graph_rows(
    db: aiosqlite.Connection, user_id: str, doc_ids: Optional[List[str]] = None
) -> Dict[str, List[aiosqlite.Row]]:
    """Read graph rows for documents the caller owns.

    Every table is joined back to `documents` so ownership is enforced in SQL
    rather than trusted from a doc_id supplied by the client.
    """
    scope = "d.user_id = ?"
    params: List[Any] = [user_id]
    if doc_ids:
        scope += f" AND d.id IN ({','.join('?' * len(doc_ids))})"
        params.extend(doc_ids)

    out = {}
    for key, table, columns in (
        ("entities", "graph_entities", "g.id, g.name, g.entity_type, g.description, g.doc_id"),
        ("relations", "graph_relations", "g.id, g.source_name, g.target_name, g.relation_type, g.description, g.weight, g.doc_id"),
        ("topics", "graph_topics", "g.id, g.title, g.summary, g.key_entities, g.doc_id"),
    ):
        cur = await db.execute(
            f"SELECT {columns} FROM {table} g JOIN documents d ON d.id = g.doc_id WHERE {scope}",
            params,
        )
        out[key] = await cur.fetchall()
    return out


@router.get("/graph", response_model=KnowledgeGraphResponse)
async def get_graph_data(
    doc_id: Optional[str] = None,
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    rows = await _graph_rows(db, user_id, [doc_id] if doc_id else None)

    doc_title = "All material"
    if doc_id:
        cur = await db.execute(
            "SELECT title FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id)
        )
        row = await cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        doc_title = row["title"]

    # Merge before rendering: entities are extracted per document, so two chapters
    # that both cover "Deadlock" would otherwise show as two disconnected nodes and
    # the graph would never link the chapters it is supposed to connect.
    merged = retrieval.merge_entities(dict(r) for r in rows["entities"])
    canonical = {retrieval.normalize_name(e["name"]): e["name"] for e in merged}
    merged_relations = retrieval.merge_relations(
        (dict(r) for r in rows["relations"]), canonical
    )

    entities = [
        EntitySchema(
            id=e["id"],
            name=e["name"],
            entity_type=e["entity_type"],
            description=e["description"],
        )
        for e in merged
    ]
    relations = [
        RelationSchema(
            id=r["id"],
            source_name=r["source_name"],
            target_name=r["target_name"],
            relation_type=r["relation_type"],
            description=r["description"],
            weight=r["weight"],
        )
        for r in merged_relations
    ]

    return KnowledgeGraphResponse(
        doc_id=doc_id or "",
        doc_title=doc_title,
        entities=entities,
        relations=relations,
        topics=[
            TopicSchema(
                id=r["id"],
                title=r["title"],
                summary=r["summary"],
                key_entities=json.loads(r["key_entities"] or "[]"),
            )
            for r in rows["topics"]
        ],
        total_nodes=len(entities),
        total_edges=len(relations),
    )


@router.post("/ask", response_model=AskRagResponse)
async def ask_rag(
    request: AskRagRequest,
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    rows = await _graph_rows(db, user_id, request.doc_ids)

    result = await lightrag_engine.answer_rag_query(
        request.query,
        [
            {"name": r["name"], "entity_type": r["entity_type"], "description": r["description"]}
            for r in rows["entities"]
        ],
        [
            {
                "source_name": r["source_name"],
                "target_name": r["target_name"],
                "relation_type": r["relation_type"],
                "description": r["description"],
                "weight": r["weight"],
            }
            for r in rows["relations"]
        ],
        [{"title": r["title"], "summary": r["summary"]} for r in rows["topics"]],
    )
    return AskRagResponse(**result)


@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    user_id: str = Depends(require_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    row = await _owned_document(db, doc_id, user_id)

    if row["file_path"] and os.path.exists(row["file_path"]):
        try:
            os.remove(row["file_path"])
        except OSError:
            pass  # DB rows still go; an orphan file is harmless.

    for table in ("graph_entities", "graph_relations", "graph_topics"):
        await db.execute(f"DELETE FROM {table} WHERE doc_id = ?", (doc_id,))
    await db.execute(
        "DELETE FROM academic_tasks WHERE source_doc_id = ? AND user_id = ?", (doc_id, user_id)
    )
    await db.execute("DELETE FROM flashcards WHERE doc_id = ? AND user_id = ?", (doc_id, user_id))
    await db.execute("DELETE FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id))
    await db.commit()

    return {"status": "success", "deleted_id": doc_id}
