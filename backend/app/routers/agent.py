from fastapi import APIRouter, Depends
from typing import Dict, Any, List
import aiosqlite
import os
import time
import httpx
from datetime import datetime, timezone

from backend.app.core.database import get_db
from backend.app.core.config import settings, BASE_DIR
from backend.app.models.schemas import AgentChatRequest, AgentChatResponse, GatewayHealthResponse
from backend.app.services.openclaw_client import openclaw_client

router = APIRouter(prefix="/api/agent", tags=["OpenClaw Agent & Copilot"])

@router.post("/chat", response_model=AgentChatResponse)
async def chat_with_agent(req: AgentChatRequest, db: aiosqlite.Connection = Depends(get_db)):
    context_parts = []
    
    if req.context_mode == "academic_tutor":
        cur_tasks = await db.execute("SELECT title, course, deadline FROM academic_tasks WHERE status = 'pending' ORDER BY deadline ASC LIMIT 3")
        task_rows = await cur_tasks.fetchall()
        if task_rows:
            tasks_str = ", ".join([f"{t['title']} ({t['course']}, due {t['deadline'][:10]})" for t in task_rows])
            context_parts.append(f"Upcoming Pending Tasks: {tasks_str}")

        now_iso = datetime.now(timezone.utc).isoformat()
        cur_cards = await db.execute("SELECT COUNT(*) FROM flashcards WHERE due <= ?", (now_iso,))
        due_count = (await cur_cards.fetchone())[0]
        context_parts.append(f"FSRS-6 Flashcards Due for Review Today: {due_count}")

    system_context = "\n".join(context_parts)
    
    result = await openclaw_client.chat(
        message=req.message,
        session_id=req.session_id or "main",
        model=req.model,
        system_context=system_context
    )
    
    return AgentChatResponse(
        reply=result["reply"],
        session_id=result["session_id"],
        model=result["model"]
    )

@router.get("/gateway-status", response_model=GatewayHealthResponse)
async def get_gateway_status():
    status_info = await openclaw_client.get_gateway_status()
    code = status_info.get("status_code")
    uptime = f"HTTP {code}" if code is not None else None
    return GatewayHealthResponse(
        status=status_info.get("status", "unknown"),
        gateway_reachable=status_info.get("gateway_reachable", False),
        gateway_url=status_info.get("gateway_url", ""),
        active_agent=status_info.get("active_agent", "main"),
        active_model=status_info.get("active_model", "9router/oc/hy3-free"),
        uptime_info=uptime
    )

@router.get("/models")
async def list_available_models() -> List[Dict[str, Any]]:
    return [
        {"id": "9router/oc/hy3-free", "name": "OpenClaw HY3 Free (200k context)", "recommended": True},
        {"id": "openrouter/nvidia/nemotron-3.5-lightning:free", "name": "Nvidia Nemotron 3.5 Lightning (Free)"},
        {"id": "openrouter/google/gemma-4-31b-it:free", "name": "Google Gemma 4 31B (Free)"},
        {"id": "openrouter/inclusionai/ling-3.0-flash:free", "name": "InclusionAI Ling 3.0 Flash (Free)"},
        {"id": "openrouter/poolside/laguna-s-2.1:free", "name": "Poolside Laguna S 2.1 (Free)"}
    ]

@router.get("/prompts")
async def get_agent_prompts() -> Dict[str, str]:
    config_dir = BASE_DIR.parent / "openclaw_config"
    prompts = {}
    files = ["SOUL.md", "AGENTS.md", "HEARTBEAT.md", "TOOLS.md"]
    for filename in files:
        file_path = config_dir / filename
        if file_path.exists():
            prompts[filename] = file_path.read_text(encoding="utf-8")
        else:
            prompts[filename] = ""
    return prompts

@router.get("/ping")
async def ping_gateway() -> Dict[str, Any]:
    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.openclaw_gateway_url}/health")
            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "success": resp.status_code == 200,
                "status_code": resp.status_code,
                "latency_ms": latency_ms,
                "url": settings.openclaw_gateway_url
            }
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        return {
            "success": False,
            "error": str(e),
            "latency_ms": latency_ms,
            "url": settings.openclaw_gateway_url
        }
