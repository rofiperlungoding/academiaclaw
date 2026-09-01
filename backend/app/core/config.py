from pydantic_settings import BaseSettings
from pydantic import Field
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    app_name: str = "AcademiaClaw Backend API"
    app_version: str = "1.0.0"
    debug: bool = True
    database_url: str = str(BASE_DIR / "data" / "academiaclaw.sqlite")
    storage_dir: str = str(BASE_DIR / "data" / "uploads")
    
    openclaw_gateway_url: str = Field(default="http://103.30.146.109:18789")
    openclaw_gateway_token: str = Field(default="0bf496a563f3cfb505a49dd431ef22c41c35f61040901f69")
    default_model: str = "9router/oc/hy3-free"
    
    nine_router_base_url: str = "https://9router.jcamp.io/v1"
    nine_router_api_key: str = "sk-91c032184a2d046f-ljlliq-df6e4c2c"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

os.makedirs(Path(settings.database_url).parent, exist_ok=True)
os.makedirs(settings.storage_dir, exist_ok=True)
