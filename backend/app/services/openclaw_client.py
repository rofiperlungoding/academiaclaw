import httpx
from typing import Dict, Any, Optional
from backend.app.core.config import settings

class OpenClawClient:
    def __init__(self):
        self.gateway_url = settings.openclaw_gateway_url.rstrip('/')
        self.gateway_token = settings.openclaw_gateway_token
        self.default_model = settings.default_model

    async def get_gateway_status(self) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.gateway_token}"
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.gateway_url}/", headers=headers)
                reachable = res.status_code in [200, 401, 404]
                return {
                    "status": "online" if reachable else "unreachable",
                    "gateway_reachable": reachable,
                    "gateway_url": self.gateway_url,
                    "active_agent": "main (AcademiaClaw)",
                    "active_model": self.default_model,
                    "status_code": res.status_code
                }
        except Exception as e:
            return {
                "status": "offline",
                "gateway_reachable": False,
                "gateway_url": self.gateway_url,
                "active_agent": "main (AcademiaClaw)",
                "active_model": self.default_model,
                "error": str(e)
            }

    async def chat(self, message: str, session_id: str = "main", model: Optional[str] = None, system_context: str = "") -> Dict[str, Any]:
        target_model = model or self.default_model
        
        headers = {
            "Authorization": f"Bearer {settings.nine_router_api_key}",
            "Content-Type": "application/json"
        }
        
        system_instruction = (
            "You are AcademiaClaw, an autonomous agentic academic copilot powered by OpenClaw AI. "
            "You specialize in active recall coaching, FSRS-6 spaced repetition guidance, "
            "LightRAG knowledge synthesis, and proactive study plan execution. "
            "Tone: direct, sharp, peer-to-peer engineering style."
        )
        if system_context:
            system_instruction += f"\n\n[ADDITIONAL CONTEXT]\n{system_context}"

        payload = {
            "model": target_model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": message}
            ],
            "temperature": 0.3,
            "max_tokens": 2048
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(f"{settings.nine_router_base_url}/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    reply = data["choices"][0]["message"]["content"]
                    return {
                        "reply": reply,
                        "session_id": session_id,
                        "model": target_model
                    }
                else:
                    return {
                        "reply": f"OpenClaw Gateway Error (Status {res.status_code}): {res.text}",
                        "session_id": session_id,
                        "model": target_model
                    }
        except Exception as e:
            return {
                "reply": f"Failed to reach model provider: {str(e)}",
                "session_id": session_id,
                "model": target_model
            }

openclaw_client = OpenClawClient()
