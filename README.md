# AcademiaClaw: Proactive Knowledge & Task Agent

Autonomous Agentic Academic Copilot developed for the **AI Competition IDwebhost**.

AcademiaClaw combines **Dual-Level LightRAG (HKU)** knowledge graph retrieval, **FSRS-6 (Free Spaced Repetition Scheduler v6)** active recall scheduling, and **OpenClaw AI Gateway** proactive heartbeat orchestration on an efficient 4GB VPS architecture.

---

## 🏛️ System Architecture

```
                               ┌────────────────────────────────────────┐
                               │           AcademiaClaw Web UI          │
                               │   (React 18 + Vite + TS + Tailwind)    │
                               └───────────────────┬────────────────────┘
                                                   │ HTTP / REST / WS
                                                   ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FastAPI Core Engine (Port 8000)                               │
│                                                                                               │
│  ┌──────────────────────────┐   ┌──────────────────────────┐   ┌───────────────────────────┐  │
│  │     Dual-Level LightRAG  │   │     FSRS-6 Scheduler     │   │    Task & Deadlines Hub   │  │
│  │   (NetworkX + Entities)  │   │     (py-fsrs Engine)     │   │   (SQLite Persistence)    │  │
│  └─────────────┬────────────┘   └─────────────┬────────────┘   └─────────────┬─────────────┘  │
└────────────────┼──────────────────────────────┼──────────────────────────────┼────────────────┘
                 │                              │                              │
                 ▼                              ▼                              ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                               OpenClaw AI Gateway (Port 18789)                                │
│                                                                                               │
│    - SOUL.md: Autonomous Academic Persona & Guardrails                                        │
│    - AGENTS.md: Ingest Specialist · Quiz Master · Deadline Sentinel                          │
│    - HEARTBEAT.md: 30-minute Periodic Check Routine (Customer-Initiated WhatsApp Window)      │
│    - Model Provider: 9router (oc/hy3-free · Nemotron 3.5 · Gemma 4)                          │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Local Development

### 1. Backend Setup

```bash
# From workspace root
pip install -r backend/requirements.txt

# Run backend API server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend UI Dashboard: `http://localhost:5173`

---

## 🧪 Running Automated Tests

```bash
# Run FSRS-6 & LightRAG unit tests
export PYTHONPATH=.
python backend/tests/test_fsrs.py
python backend/tests/test_lightrag.py
```

---

## 🔄 CI/CD Auto-Deployment to VPS

This repository is configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys updates to the IDwebhost VPS upon every commit pushed to `main`.

### Required GitHub Repository Secrets

Configure these in **GitHub Repo > Settings > Secrets and variables > Actions**.
Never commit real values to this file — a public repository exposes them permanently,
including in Git history.

| Secret Name | Description |
|---|---|
| `VPS_HOST` | VPS IP address |
| `VPS_PORT` | SSH port |
| `VPS_USER` | SSH user |
| `VPS_SSH_KEY` | Private SSH key. Prefer this over a password. |

### Runtime Environment

The backend reads secrets from the environment, never from source. Copy
`.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"   # JWT_SECRET
```

`JWT_SECRET` signs login tokens. With `DEBUG=false` the server refuses to start
without it, since an empty signing key lets anyone forge a session for any user.

## 📦 Project Structure

```
idwebhost/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automated CI/CD workflow
├── backend/
│   ├── app/
│   │   ├── core/                 # Config, Database schema
│   │   ├── models/               # Pydantic schemas
│   │   ├── services/             # LightRAG, FSRS-6, PDF Parser, OpenClaw Client
│   │   ├── routers/              # Knowledge, Flashcards, Tasks, Agent
│   │   └── main.py               # FastAPI entry point
│   ├── tests/                    # Backend unit tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           # GraphVisualizer, Overview, KnowledgeStudio, etc.
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   └── types.ts
│   └── package.json
├── openclaw_config/
│   ├── SOUL.md                   # Agent personality and directives
│   ├── AGENTS.md                 # Multi-agent routing specification
│   ├── HEARTBEAT.md              # Scheduled cron routine
│   └── TOOLS.md                  # Custom API tool declarations
└── scripts/
    ├── setup_vps.sh              # VPS provisioning script
    └── deploy.sh                 # Deployment script
```
