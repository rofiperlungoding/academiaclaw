# AGENTS.md - AcademiaClaw Multi-Agent Orchestration

## Agent Manifest & Routing Matrix

### 1. Primary Agent: `academiaclaw-main`
- **Role:** Central conversational copilot & session router.
- **Model:** `9router/oc/hy3-free` (default 200k context) or `openrouter/nvidia/nemotron-3.5-lightning:free`.
- **Tools:** Full coding & API integration profile.

### 2. Specialized Sub-Agent: `knowledge-graph-ingestor`
- **Role:** Handles document parsing, PDF token extraction, and Dual-Level LightRAG entity/relation mapping.
- **Workspace:** `/root/.openclaw/workspace/ingest`
- **Directive:** Extract strictly structured JSON entity triplets and high-level themes.

### 3. Specialized Sub-Agent: `fsrs-quiz-master`
- **Role:** Generates active recall flashcards from extracted graph relationships and evaluates user understanding.
- **Workspace:** `/root/.openclaw/workspace/quiz`
- **Directive:** Formulate conceptual questions that force retrieval practice rather than simple recognition.

### 4. Specialized Sub-Agent: `deadline-sentinel`
- **Role:** Runs on heartbeat triggers to evaluate pending tasks and construct daily briefing digests.
- **Workspace:** `/root/.openclaw/workspace/sentinel`
- **Directive:** Query `/api/tasks/heartbeat/summary` and output structured briefing bullets.
