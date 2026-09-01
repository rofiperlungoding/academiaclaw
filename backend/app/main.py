from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from pathlib import Path

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.routers import knowledge, flashcards, tasks, agent, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(knowledge.router)
app.include_router(flashcards.router)
app.include_router(tasks.router)
app.include_router(agent.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "openclaw_gateway": settings.openclaw_gateway_url
    }

from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

@app.exception_handler(StarletteHTTPException)
async def spa_exception_handler(request, exc):
    if exc.status_code == 404:
        if request.url.path.startswith("/api") or request.url.path.startswith("/docs") or request.url.path.startswith("/openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        if frontend_dist.exists():
            index_file = frontend_dist / "index.html"
            if index_file.exists():
                return FileResponse(str(index_file))
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
