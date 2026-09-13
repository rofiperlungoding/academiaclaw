import time
from typing import Any, Dict, Optional

import httpx

from backend.app.core.config import settings

SYSTEM_INSTRUCTION = (
    "You are AcademiaClaw, an autonomous academic copilot. You coach active recall, "
    "explain concepts grounded in the student's own uploaded material, and keep their "
    "deadlines in view. Tone: direct, peer-to-peer, no filler."
)


class OpenClawClient:
    """Talks to the OpenClaw Gateway, which exposes an OpenAI-compatible surface.

    Chat routes through the gateway (`/v1/chat/completions` on the gateway port) so
    the agent's own session, tools and memory apply. 9router is kept only as a
    fallback for when the gateway is down, so a demo never dies on stage — and the
    response says which path answered.
    """

    def __init__(self) -> None:
        self.gateway_url = settings.openclaw_gateway_url.rstrip("/")
        self.gateway_token = settings.openclaw_gateway_token
        self.default_model = settings.default_model
        self.agent_id = settings.openclaw_agent_id

    async def get_gateway_status(self) -> Dict[str, Any]:
        """Probe the gateway. Only an authenticated-or-OK response counts as up.

        A 404 means something answered on the port but it is not the gateway API,
        so it must not be reported as healthy.
        """
        started = time.time()
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    f"{self.gateway_url}/v1/models",
                    headers={"Authorization": f"Bearer {self.gateway_token}"},
                )
            reachable = res.status_code in (200, 401, 403)
            return {
                "status": "online" if res.status_code == 200 else ("auth_required" if reachable else "unreachable"),
                "gateway_reachable": reachable,
                "gateway_url": self.gateway_url,
                "active_agent": self.agent_id,
                "active_model": self.default_model,
                "status_code": res.status_code,
                "latency_ms": int((time.time() - started) * 1000),
            }
        except Exception as e:
            return {
                "status": "offline",
                "gateway_reachable": False,
                "gateway_url": self.gateway_url,
                "active_agent": self.agent_id,
                "active_model": self.default_model,
                "error": str(e),
                "latency_ms": int((time.time() - started) * 1000),
            }

    def _payload(self, message: str, model: str, system_context: str) -> Dict[str, Any]:
        system = SYSTEM_INSTRUCTION
        if system_context:
            system += f"\n\n[STUDENT CONTEXT]\n{system_context}"
        return {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": message},
            ],
            "temperature": 0.3,
            "max_tokens": 2048,
        }

    async def chat(
        self,
        message: str,
        session_id: str = "main",
        model: Optional[str] = None,
        system_context: str = "",
    ) -> Dict[str, Any]:
        target_model = model or self.default_model

        gateway_error = await self._try_gateway(message, session_id, target_model, system_context)
        if not isinstance(gateway_error, str):
            return gateway_error

        direct = await self._try_direct(message, session_id, target_model, system_context)
        if not isinstance(direct, str):
            direct["degraded"] = True
            direct["note"] = f"Gateway unavailable ({gateway_error}); answered via model provider directly."
            return direct

        return {
            "reply": f"Agent unreachable. Gateway: {gateway_error}. Provider: {direct}",
            "session_id": session_id,
            "model": target_model,
            "route": "none",
            "degraded": True,
        }

    async def _try_gateway(self, message, session_id, model, system_context):
        """Returns a result dict on success, or an error string on failure."""
        headers = {
            "Authorization": f"Bearer {self.gateway_token}",
            "Content-Type": "application/json",
            "x-openclaw-agent-id": self.agent_id,
        }
        payload = self._payload(message, "openclaw", system_context)
        payload["session_id"] = session_id
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(
                    f"{self.gateway_url}/v1/chat/completions", headers=headers, json=payload
                )
            if res.status_code != 200:
                return f"HTTP {res.status_code}"
            data = res.json()
            return {
                "reply": data["choices"][0]["message"]["content"],
                "session_id": session_id,
                "model": data.get("model", model),
                "route": "openclaw_gateway",
            }
        except Exception as e:
            return type(e).__name__

    async def _try_direct(self, message, session_id, model, system_context):
        headers = {
            "Authorization": f"Bearer {settings.nine_router_api_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(
                    f"{settings.nine_router_base_url}/chat/completions",
                    headers=headers,
                    json=self._payload(message, model, system_context),
                )
            if res.status_code != 200:
                return f"HTTP {res.status_code}"
            data = res.json()
            return {
                "reply": data["choices"][0]["message"]["content"],
                "session_id": session_id,
                "model": model,
                "route": "model_provider_direct",
            }
        except Exception as e:
            return type(e).__name__


openclaw_client = OpenClawClient()
