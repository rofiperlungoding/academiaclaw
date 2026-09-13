from pydantic_settings import BaseSettings
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    app_name: str = "AcademiaClaw Backend API"
    app_version: str = "1.0.0"
    debug: bool = True
    database_url: str = str(BASE_DIR / "data" / "academiaclaw.sqlite")
    storage_dir: str = str(BASE_DIR / "data" / "uploads")
    
    openclaw_gateway_url: str = "http://127.0.0.1:18789"
    openclaw_gateway_token: str = ""
    default_model: str = "9router/oc/hy3-free"
    openclaw_agent_id: str = "main"
    # WhatsApp target for proactive pushes. E.164 for a direct chat, or a group JID.
    notify_whatsapp_to: str = ""
    
    nine_router_base_url: str = "https://9router.jcamp.io/v1"
    nine_router_api_key: str = ""
    
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 72

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

os.makedirs(Path(settings.database_url).parent, exist_ok=True)
os.makedirs(settings.storage_dir, exist_ok=True)


def _resolve_jwt_secret() -> str:
    """Never ship a default signing key.

    A hardcoded or empty JWT secret lets anyone mint a token for any user, so it
    must come from the environment in production. For local development a random
    secret is generated once and cached in a gitignored file, so logins survive a
    restart without anyone having to configure anything.
    """
    if settings.jwt_secret:
        return settings.jwt_secret

    if not settings.debug:
        raise RuntimeError(
            "JWT_SECRET is not set. Export it before starting the server:\n"
            "  JWT_SECRET=$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
        )

    import secrets

    cache = Path(settings.database_url).parent / ".jwt_secret"
    if not cache.exists():
        cache.write_text(secrets.token_urlsafe(48), encoding="utf-8")
        print(f"[config] DEBUG mode: generated a local JWT secret at {cache}")
    return cache.read_text(encoding="utf-8").strip()


settings.jwt_secret = _resolve_jwt_secret()
