# TOOLS.md - AcademiaClaw Custom API Tools

```json
[
  {
    "name": "ask_knowledge_graph",
    "description": "Query the Dual-Level LightRAG knowledge graph for multi-hop course concepts.",
    "endpoint": "http://127.0.0.1:8000/api/knowledge/ask",
    "method": "POST",
    "parameters": {
      "query": { "type": "string", "description": "The student question or concept to synthesize" }
    }
  },
  {
    "name": "get_due_flashcards",
    "description": "Retrieve FSRS-6 flashcards that are due for active recall review.",
    "endpoint": "http://127.0.0.1:8000/api/flashcards?due_only=true",
    "method": "GET"
  },
  {
    "name": "get_academic_tasks",
    "description": "List pending academic deadlines, course assignments, and practical tasks.",
    "endpoint": "http://127.0.0.1:8000/api/tasks?status=pending",
    "method": "GET"
  }
]
```
