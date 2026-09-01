from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Optional
import os
import uuid
import json
import aiosqlite
from datetime import datetime, timezone, timedelta

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.schemas import (
    DocumentResponse,
    KnowledgeGraphResponse,
    EntitySchema,
    RelationSchema,
    TopicSchema,
    AskRagRequest,
    AskRagResponse
)
from backend.app.services.pdf_parser import doc_parser
from backend.app.services.lightrag_engine import lightrag_engine

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge & LightRAG"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: aiosqlite.Connection = Depends(get_db)
):
    doc_id = str(uuid.uuid4())
    doc_title = title or file.filename
    file_path = os.path.join(settings.storage_dir, f"{doc_id}_{file.filename}")
    
    file_content = await file.read()
    with open(file_path, "wb") as f:
        f.write(file_content)
        
    extracted_text = doc_parser.extract_text_from_file(file_path)
    if not extracted_text:
        raise HTTPException(status_code=400, detail="Failed to extract text from document or file is empty.")

    extracted_data = await lightrag_engine.extract_graph_and_topics(extracted_text, doc_title)
    
    summary = extracted_data.get("summary", "")
    
    await db.execute(
        "INSERT INTO documents (id, title, filename, file_path, file_size, extracted_text, summary) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (doc_id, doc_title, file.filename, file_path, len(file_content), extracted_text, summary)
    )

    entities = extracted_data.get("entities", [])
    for ent in entities:
        ent_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO graph_entities (id, doc_id, name, entity_type, description) VALUES (?, ?, ?, ?, ?)",
            (ent_id, doc_id, ent["name"], ent.get("type", "Concept"), ent.get("description", ""))
        )

    relations = extracted_data.get("relations", [])
    for rel in relations:
        rel_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO graph_relations (id, doc_id, source_name, target_name, relation_type, description, weight) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (rel_id, doc_id, rel["source"], rel["target"], rel.get("relation", "relates_to"), rel.get("description", ""), rel.get("weight", 1.0))
        )

    topics = extracted_data.get("topics", [])
    for top in topics:
        top_id = str(uuid.uuid4())
        key_ents = json.dumps(top.get("key_entities", []))
        await db.execute(
            "INSERT INTO graph_topics (id, doc_id, title, summary, key_entities) VALUES (?, ?, ?, ?, ?)",
            (top_id, doc_id, top["title"], top.get("summary", ""), key_ents)
        )

    tasks = extracted_data.get("tasks", [])
    now = datetime.now(timezone.utc)
    for task in tasks:
        task_id = str(uuid.uuid4())
        deadline_days = task.get("deadline_days", 7)
        deadline_dt = now + timedelta(days=deadline_days)
        await db.execute(
            "INSERT INTO academic_tasks (id, title, course, task_type, deadline, priority, notes, source_doc_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (task_id, task["title"], task.get("course", doc_title), task.get("task_type", "Tugas"), deadline_dt.isoformat(), task.get("priority", "medium"), task.get("notes", ""), doc_id)
        )

    flashcards = extracted_data.get("flashcards", [])
    for card in flashcards:
        card_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO flashcards (id, doc_id, question, answer, card_type, difficulty, stability, retrievability, reps, lapses, state, due) VALUES (?, ?, ?, ?, ?, 0.0, 0.0, 1.0, 0, 0, 0, ?)",
            (card_id, doc_id, card["question"], card["answer"], card.get("card_type", "concept"), now.isoformat())
        )

    await db.commit()

    return DocumentResponse(
        id=doc_id,
        title=doc_title,
        filename=file.filename,
        file_size=len(file_content),
        summary=summary,
        created_at=now,
        entities_count=len(entities),
        relations_count=len(relations),
        topics_count=len(topics)
    )

@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id, title, filename, file_size, summary, created_at FROM documents ORDER BY created_at DESC")
    rows = await cursor.fetchall()
    
    docs = []
    for r in rows:
        ent_cur = await db.execute("SELECT COUNT(*) FROM graph_entities WHERE doc_id = ?", (r["id"],))
        ent_count = (await ent_cur.fetchone())[0]
        
        rel_cur = await db.execute("SELECT COUNT(*) FROM graph_relations WHERE doc_id = ?", (r["id"],))
        rel_count = (await rel_cur.fetchone())[0]
        
        top_cur = await db.execute("SELECT COUNT(*) FROM graph_topics WHERE doc_id = ?", (r["id"],))
        top_count = (await top_cur.fetchone())[0]
        
        created_dt = datetime.fromisoformat(r["created_at"].replace('Z', '+00:00')) if isinstance(r["created_at"], str) else r["created_at"]
        
        docs.append(DocumentResponse(
            id=r["id"],
            title=r["title"],
            filename=r["filename"],
            file_size=r["file_size"],
            summary=r["summary"] or "",
            created_at=created_dt,
            entities_count=ent_count,
            relations_count=rel_count,
            topics_count=top_count
        ))
    return docs

@router.get("/graph", response_model=KnowledgeGraphResponse)
async def get_graph_data(doc_id: Optional[str] = None, db: aiosqlite.Connection = Depends(get_db)):
    if doc_id:
        doc_cur = await db.execute("SELECT title FROM documents WHERE id = ?", (doc_id,))
        doc_row = await doc_cur.fetchone()
        if not doc_row:
            raise HTTPException(status_code=404, detail="Document not found")
        doc_title = doc_row["title"]
        
        ent_cur = await db.execute("SELECT id, name, entity_type, description FROM graph_entities WHERE doc_id = ?", (doc_id,))
        rel_cur = await db.execute("SELECT id, source_name, target_name, relation_type, description, weight FROM graph_relations WHERE doc_id = ?", (doc_id,))
        top_cur = await db.execute("SELECT id, title, summary, key_entities FROM graph_topics WHERE doc_id = ?", (doc_id,))
    else:
        doc_title = "Global Knowledge Graph"
        ent_cur = await db.execute("SELECT id, name, entity_type, description FROM graph_entities LIMIT 150")
        rel_cur = await db.execute("SELECT id, source_name, target_name, relation_type, description, weight FROM graph_relations LIMIT 200")
        top_cur = await db.execute("SELECT id, title, summary, key_entities FROM graph_topics LIMIT 50")

    ent_rows = await ent_cur.fetchall()
    rel_rows = await rel_cur.fetchall()
    top_rows = await top_cur.fetchall()

    entities = [EntitySchema(id=r["id"], name=r["name"], entity_type=r["entity_type"], description=r["description"]) for r in ent_rows]
    relations = [RelationSchema(id=r["id"], source_name=r["source_name"], target_name=r["target_name"], relation_type=r["relation_type"], description=r["description"], weight=r["weight"]) for r in rel_rows]
    
    topics = []
    for r in top_rows:
        try:
            key_ents = json.loads(r["key_entities"])
        except Exception:
            key_ents = []
        topics.append(TopicSchema(id=r["id"], title=r["title"], summary=r["summary"], key_entities=key_ents))

    return KnowledgeGraphResponse(
        doc_id=doc_id or "global",
        doc_title=doc_title,
        entities=entities,
        relations=relations,
        topics=topics,
        total_nodes=len(entities),
        total_edges=len(relations)
    )

@router.post("/ask", response_model=AskRagResponse)
async def ask_rag(request: AskRagRequest, db: aiosqlite.Connection = Depends(get_db)):
    if request.doc_ids:
        placeholders = ",".join(["?"] * len(request.doc_ids))
        ent_cur = await db.execute(f"SELECT name, entity_type, description FROM graph_entities WHERE doc_id IN ({placeholders})", request.doc_ids)
        rel_cur = await db.execute(f"SELECT source_name, target_name, relation_type, description, weight FROM graph_relations WHERE doc_id IN ({placeholders})", request.doc_ids)
        top_cur = await db.execute(f"SELECT title, summary, key_entities FROM graph_topics WHERE doc_id IN ({placeholders})", request.doc_ids)
    else:
        ent_cur = await db.execute("SELECT name, entity_type, description FROM graph_entities LIMIT 150")
        rel_cur = await db.execute("SELECT source_name, target_name, relation_type, description, weight FROM graph_relations LIMIT 200")
        top_cur = await db.execute("SELECT title, summary, key_entities FROM graph_topics LIMIT 50")

    ent_rows = await ent_cur.fetchall()
    rel_rows = await rel_cur.fetchall()
    top_rows = await top_cur.fetchall()

    entities = [{"name": r["name"], "entity_type": r["entity_type"], "description": r["description"]} for r in ent_rows]
    relations = [{"source_name": r["source_name"], "target_name": r["target_name"], "relation_type": r["relation_type"], "description": r["description"], "weight": r["weight"]} for r in rel_rows]
    topics = [{"title": r["title"], "summary": r["summary"]} for r in top_rows]

    result = await lightrag_engine.answer_rag_query(request.query, entities, relations, topics)
    return AskRagResponse(**result)

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, db: aiosqlite.Connection = Depends(get_db)):
    cur = await db.execute("SELECT file_path FROM documents WHERE id = ?", (doc_id,))
    row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
        
    file_path = row["file_path"]
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    await db.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    await db.execute("DELETE FROM graph_entities WHERE doc_id = ?", (doc_id,))
    await db.execute("DELETE FROM graph_relations WHERE doc_id = ?", (doc_id,))
    await db.execute("DELETE FROM graph_topics WHERE doc_id = ?", (doc_id,))
    await db.execute("DELETE FROM academic_tasks WHERE source_doc_id = ?", (doc_id,))
    await db.execute("DELETE FROM flashcards WHERE doc_id = ?", (doc_id,))
    await db.commit()

    return {"status": "success", "deleted_id": doc_id}
